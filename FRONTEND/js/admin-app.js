import { getStore, saveStore, subscribeStore, getOrders, saveOrders, subscribeOrders } from './shared/store.js';
import { initBackendIntegration } from './shared/backend-init.js';
import { productsAPI, ordersAPI, uploadsAPI } from './shared/api.js';
import { formatKSh } from './shared/format.js';
import { escapeHtml } from './shared/dom.js';

let editingId = null;

function navigateTo(section) {
  if (!section) return;
  document.querySelectorAll('.page-section').forEach((s) => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'));
  document.getElementById(`section-${section}`)?.classList.add('active');
  document.querySelector(`[data-section="${section}"]`)?.classList.add('active');
  const titles = {
    dashboard: 'Dashboard Overview',
    products: 'Product Management',
    orders: 'Order Management',
    customers: 'Customer Management',
    coupons: 'Coupons & Discounts',
    settings: 'Settings'
  };
  const pt = document.getElementById('page-title');
  if (pt) pt.textContent = titles[section] || 'Dashboard';
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('active');
}

function readFilesAsDataUrls(fileList) {
  const files = Array.from(fileList || []);
  return Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const fr = new FileReader();
          fr.onload = () => resolve(String(fr.result));
          fr.onerror = () => reject(fr.error);
          fr.readAsDataURL(file);
        })
    )
  );
}

function renderProducts() {
  const tbody = document.getElementById('products-tbody');
  if (!tbody) return;
  const { products } = getStore();
  const sorted = [...products].sort((a, b) => a.sortOrder - b.sortOrder);
  tbody.innerHTML = sorted
    .map((p) => {
      const thumb = p.images?.[0] ? `<img class="product-thumb" src="${escapeHtml(p.images[0])}" alt="" />` : '📦';
      const priceCell = `${formatKSh(p.currentPrice)}${
        p.originalPrice != null && p.originalPrice > p.currentPrice
          ? ` <span style="color:var(--muted-fg);font-size:.75rem;text-decoration:line-through">${formatKSh(p.originalPrice)}</span>`
          : ''
      }`;
      const status = p.active ? 'Active' : 'Hidden';
      const badge = p.active ? 'badge-success' : 'badge-danger';
      return `<tr data-pid="${escapeHtml(p.id)}">
        <td>${thumb}</td>
        <td><strong>${escapeHtml(p.name)}</strong></td>
        <td>${escapeHtml(p.category)}</td>
        <td>${priceCell}</td>
        <td>${p.stock ?? '—'}</td>
        <td><span class="badge ${badge}">${status}</span></td>
        <td>
          <div class="action-btns">
            <a class="btn btn-outline btn-sm" href="product.html?id=${encodeURIComponent(p.id)}" target="_blank" rel="noopener">View on store</a>
            <button type="button" class="btn btn-outline btn-sm" data-move="${escapeHtml(p.id)}" data-dir="-1" title="Move up">↑</button>
            <button type="button" class="btn btn-outline btn-sm" data-move="${escapeHtml(p.id)}" data-dir="1" title="Move down">↓</button>
            <button type="button" class="btn btn-outline btn-sm" data-edit="${escapeHtml(p.id)}">Edit</button>
            <button type="button" class="btn btn-danger btn-sm" data-del="${escapeHtml(p.id)}">Delete</button>
          </div>
        </td>
      </tr>`;
    })
    .join('');

  tbody.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => openEdit(btn.getAttribute('data-edit')));
  });
  tbody.querySelectorAll('[data-del]').forEach((btn) => {
    btn.addEventListener('click', () => deleteProduct(btn.getAttribute('data-del')));
  });
  tbody.querySelectorAll('[data-move]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-move');
      const dir = Number(btn.getAttribute('data-dir'));
      if (id) moveProduct(id, dir);
    });
  });
}

async function fetchBackendOrders() {
  try {
    const orders = await ordersAPI.getAll();
    saveOrders(orders || []);
  } catch (error) {
    console.warn('Unable to fetch backend orders:', error.message);
  }
}

function moveProduct(id, dir) {
  const store = getStore();
  const sorted = [...store.products].sort((a, b) => a.sortOrder - b.sortOrder);
  const idx = sorted.findIndex((p) => p.id === id);
  const j = idx + dir;
  if (idx < 0 || j < 0 || j >= sorted.length) return;
  const t = sorted[idx];
  sorted[idx] = sorted[j];
  sorted[j] = t;
  sorted.forEach((p, i) => {
    p.sortOrder = (i + 1) * 10;
  });
  store.products = sorted;
  saveStore(store);
  renderProducts();
}

async function deleteProduct(id) {
  if (!id || !confirm('Delete this product?')) return;
  try {
    await productsAPI.delete(id);
    await initBackendIntegration();
    refreshAll();
  } catch (error) {
    console.warn('Backend delete failed, falling back to local removal:', error.message);
    const store = getStore();
    store.products = store.products.filter((p) => p.id !== id);
    saveStore(store);
    renderProducts();
    renderDashboard();
  }
}

function openAdd() {
  editingId = null;
  const form = document.getElementById('product-form');
  form?.reset();
  document.getElementById('product-modal-title').textContent = 'Add Product';
  document.getElementById('product-modal').classList.add('active');
}

function openEdit(id) {
  const p = getStore().products.find((x) => x.id === id);
  if (!p) return;
  editingId = id;
  document.getElementById('product-modal-title').textContent = 'Edit Product';
  document.getElementById('pf-name').value = p.name;
  document.getElementById('pf-desc').value = p.description || '';
  document.getElementById('pf-category').value = p.category;
  document.getElementById('pf-current').value = String(p.currentPrice);
  document.getElementById('pf-original').value = p.originalPrice != null ? String(p.originalPrice) : '';
  document.getElementById('pf-sku').value = p.sku || '';
  document.getElementById('pf-stock').value = p.stock != null ? String(p.stock) : '';
  document.getElementById('pf-active').checked = !!p.active;
  document.getElementById('pf-discount').value = p.discountLabel || '';
  document.getElementById('pf-unit').value = p.unit || 'each';
  document.getElementById('pf-badge').value = p.badge || '';
  document.getElementById('pf-rating').value = String(p.rating ?? 4.5);
  document.getElementById('pf-reviews').value = String(p.reviews ?? 0);
  document.getElementById('pf-images').value = '';
  document.getElementById('product-modal').classList.add('active');
}

function closeModal() {
  document.getElementById('product-modal')?.classList.remove('active');
  editingId = null;
}

async function saveProduct() {
  const name = document.getElementById('pf-name').value.trim();
  const description = document.getElementById('pf-desc').value.trim();
  const category = document.getElementById('pf-category').value;
  const currentPrice = Number(document.getElementById('pf-current').value);
  const originalRaw = document.getElementById('pf-original').value.trim();
  const originalPrice = originalRaw === '' ? null : Number(originalRaw);
  const sku = document.getElementById('pf-sku').value.trim() || null;
  const stockRaw = document.getElementById('pf-stock').value.trim();
  const stock = stockRaw === '' ? null : Number(stockRaw);
  const active = document.getElementById('pf-active').checked;
  const discountLabel = document.getElementById('pf-discount').value.trim() || null;
  const unit = document.getElementById('pf-unit').value.trim() || 'each';
  const badge = document.getElementById('pf-badge').value.trim() || null;
  const rating = Number(document.getElementById('pf-rating').value) || 0;
  const reviews = Number(document.getElementById('pf-reviews').value) || 0;
  const fileInput = document.getElementById('pf-images');

  if (!name || !category || !Number.isFinite(currentPrice)) {
    alert('Name, category, and current price are required.');
    return;
  }

  let newUrls = [];
  if (fileInput?.files?.length) {
    try {
      newUrls = await uploadsAPI.uploadProductImages(fileInput.files);
    } catch (uploadError) {
      console.warn('Backend image upload failed, falling back to local data URLs:', uploadError.message);
      newUrls = await readFilesAsDataUrls(fileInput.files);
    }
  }

  const store = getStore();
  const maxOrder = store.products.reduce((m, p) => Math.max(m, p.sortOrder || 0), 0);
  const payload = {
    name,
    description,
    category,
    currentPrice,
    originalPrice: originalPrice != null && Number.isFinite(originalPrice) ? originalPrice : null,
    sku,
    stock,
    active,
    discountLabel,
    unit,
    badge,
    rating,
    reviews,
    images: newUrls.length ? newUrls : undefined,
    sortOrder: maxOrder + 10
  };

  try {
    if (editingId) {
      await productsAPI.update(editingId, payload);
    } else {
      const result = await productsAPI.create(payload);
      if (result && result.id) {
        editingId = result.id;
      }
    }
    await initBackendIntegration();
    refreshAll();
  } catch (error) {
    console.warn('Backend product save failed, falling back to local store:', error.message);
    if (editingId) {
      const p = store.products.find((x) => x.id === editingId);
      if (p) {
        Object.assign(p, {
          name,
          description,
          category,
          currentPrice,
          originalPrice: originalPrice != null && Number.isFinite(originalPrice) ? originalPrice : null,
          sku,
          stock,
          active,
          discountLabel,
          unit,
          badge,
          rating,
          reviews,
          images: newUrls.length ? [...newUrls, ...(p.images || [])] : p.images
        });
      }
    } else {
      store.products.push({
        id: `p-${Date.now()}`,
        name,
        description,
        category,
        currentPrice,
        originalPrice: originalPrice != null && Number.isFinite(originalPrice) ? originalPrice : null,
        sku,
        stock,
        active,
        discountLabel,
        unit,
        badge,
        rating,
        reviews,
        images: newUrls.length ? newUrls : [],
        sortOrder: maxOrder + 10
      });
    }
    saveStore(store);
    renderProducts();
    renderDashboard();
  } finally {
    closeModal();
  }
}

function renderOrders() {
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;
  const orders = getOrders();
  if (!orders.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="muted">No checkout orders yet (prototype orders appear after a storefront checkout).</td></tr>`;
    return;
  }
  tbody.innerHTML = orders
    .map((o) => {
      const lines = Array.isArray(o.lines)
        ? o.lines.map((l) => `${escapeHtml(l.name)} ×${l.quantity}`).join(', ')
        : `${escapeHtml(String(o.item_count || o.itemCount || 0))} item(s)`;
      const createdAt = o.createdAt || o.created_at || '';
      const subtotal = o.subtotal != null ? o.subtotal : o.total_amount || 0;
      const status = o.status || o.order_status || 'unknown';
      return `<tr>
        <td><strong>${escapeHtml(o.id)}</strong></td>
        <td>${escapeHtml(o.customerName || o.customer_name || '—')}</td>
        <td style="max-width:220px">${lines}</td>
        <td>${formatKSh(subtotal)}</td>
        <td><span class="badge badge-warning">${escapeHtml(status)}</span></td>
        <td>${escapeHtml(String(createdAt).slice(0, 10))}</td>
        <td><a class="btn btn-outline btn-sm" href="index.html" target="_blank" rel="noopener">Storefront</a></td>
      </tr>`;
    })
    .join('');
}

function renderDashboard() {
  const store = getStore();
  const orders = getOrders();
  // Revenue card here represents potential checkout revenue from available products.
  const revenue = store.products.reduce((sum, p) => {
    if (p.active === false) return sum;
    const stock = Number(p.stock ?? 0);
    const price = Number(p.currentPrice ?? p.current_price ?? 0);
    return sum + Math.max(0, stock) * Math.max(0, price);
  }, 0);
  const low = store.products.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5).length;
  const out = store.products.filter((p) => (p.stock ?? 0) === 0).length;

  const statVals = document.querySelectorAll('[data-dash-stat]');
  statVals.forEach((el) => {
    const k = el.getAttribute('data-dash-stat');
    if (k === 'revenue') el.textContent = formatKSh(revenue);
    if (k === 'orders') el.textContent = String(orders.length);
    if (k === 'products') el.textContent = String(store.products.length);
    if (k === 'low') el.textContent = String(low + out);
  });

  const recent = document.querySelector('#recent-orders-tbody');
  if (recent) {
    recent.innerHTML = orders.slice(0, 6).length
      ? orders
          .slice(0, 6)
          .map((o) => {
            const createdAt = o.createdAt || o.created_at || '';
            const subtotal = Number(o.total_amount ?? o.subtotal ?? 0);
            const status = o.status || o.order_status || 'unknown';
            const customerName = o.customerName || o.customer_name || '—';
            return `<tr><td><strong>${escapeHtml(o.id)}</strong></td><td>${escapeHtml(customerName)}</td><td>${formatKSh(
              subtotal
            )}</td><td><span class="badge badge-warning">${escapeHtml(status)}</span></td><td>${escapeHtml(
              String(createdAt).slice(0, 10)
            )}</td></tr>`;
          })
          .join('')
      : `<tr><td colspan="5" class="muted">No orders yet.</td></tr>`;
  }

  const alerts = document.getElementById('low-stock-alerts');
  if (alerts) {
    const bits = [];
    if (out) bits.push(`<div class="alert alert-warning"><span class="alert-icon">🚨</span><div><strong>${out} product(s) out of stock.</strong></div></div>`);
    if (low) bits.push(`<div class="alert alert-warning"><span class="alert-icon">⚠️</span><div><strong>${low} product(s) low stock (≤5).</strong></div></div>`);
    alerts.innerHTML = bits.join('') || '';
  }
}

function loadSettingsForm() {
  const s = getStore().settings;
  document.querySelectorAll('[data-site-brand]').forEach((el) => {
    el.textContent = s.storeName;
  });
  const setVal = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = v;
  };
  setVal('st-name', s.storeName);
  setVal('st-phone', s.supportPhone);
  setVal('st-headline', s.heroHeadline);
  setVal('st-sub', s.heroSubcopy);
  setVal('st-cta', s.heroCtaLabel);
  setVal('st-cta-href', s.heroCtaHref);
  const ratings = document.getElementById('st-ratings');
  if (ratings) ratings.checked = !!s.flags?.showRatingStars;
}

function saveSettings() {
  const store = getStore();
  const gv = (id) => document.getElementById(id)?.value ?? '';
  store.settings.storeName = gv('st-name').trim() || store.settings.storeName;
  store.settings.supportPhone = gv('st-phone').trim();
  store.settings.heroHeadline = gv('st-headline').trim();
  store.settings.heroSubcopy = gv('st-sub').trim();
  store.settings.heroCtaLabel = gv('st-cta').trim();
  store.settings.heroCtaHref = gv('st-cta-href').trim();
  const ratings = document.getElementById('st-ratings');
  store.settings.flags = { showRatingStars: !!(ratings && ratings.checked) };
  saveStore(store);
  alert('Settings saved locally.');
}

async function saveHeroImages() {
  const store = getStore();
  if (!Array.isArray(store.settings.heroImages)) store.settings.heroImages = [null, null, null];
  const next = [...store.settings.heroImages];
  for (let i = 0; i < 3; i += 1) {
    const inp = document.getElementById(`hf${i}`);
    if (inp?.files?.length) {
      const urls = await readFilesAsDataUrls(inp.files);
      next[i] = urls[0] || next[i];
    }
  }
  store.settings.heroImages = next;
  saveStore(store);
  alert('Hero images updated (slot 1–3).');
}

function initCharts() {
  if (typeof Chart === 'undefined') return;
  const salesCtx = document.getElementById('salesChart')?.getContext('2d');
  if (salesCtx) {
    // eslint-disable-next-line no-new
    new Chart(salesCtx, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Revenue (KSh, demo)',
            data: [320000, 450000, 380000, 520000, 610000, 480000],
            backgroundColor: 'hsla(142, 43%, 32%, 0.75)'
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            ticks: {
              callback: (v) => `KSh ${Number(v).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`
            }
          }
        }
      }
    });
  }
  const catCtx = document.getElementById('categoryChart')?.getContext('2d');
  if (catCtx) {
    // eslint-disable-next-line no-new
    new Chart(catCtx, {
      type: 'doughnut',
      data: {
        labels: ['Seeds', 'Feed', 'Tools', 'Other'],
        datasets: [{ data: [40, 25, 20, 15], backgroundColor: ['#3a7d44', '#c8842a', '#2d6a4f', '#6b7a6b'] }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
  }
}

function refreshAll() {
  renderProducts();
  renderOrders();
  renderDashboard();
  loadSettingsForm();
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 AGROMART Admin Panel Starting...');
  await initBackendIntegration();
  await fetchBackendOrders();

  document.querySelectorAll('.sidebar-nav .nav-item[data-section]').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      if (!section) return;
      navigateTo(section);
    });
  });

  document.querySelector('.sidebar-nav')?.addEventListener('click', (e) => {
    const item = /** @type {HTMLElement|null} */ (e.target instanceof Element ? e.target.closest('.nav-item[data-section]') : null);
    if (!item) return;
    const section = item.dataset.section;
    if (!section) return;
    e.preventDefault();
    navigateTo(section);
  });

  document.getElementById('menu-toggle')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
    document.getElementById('sidebar-overlay')?.classList.toggle('active');
  });
  document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('active');
  });

  document.getElementById('adminAddProduct')?.addEventListener('click', openAdd);
  document.getElementById('product-modal-close')?.addEventListener('click', closeModal);
  document.getElementById('product-cancel')?.addEventListener('click', closeModal);
  document.getElementById('product-save')?.addEventListener('click', () => saveProduct().catch((e) => alert(String(e))));

  document.getElementById('save-settings')?.addEventListener('click', saveSettings);
  document.getElementById('save-hero')?.addEventListener('click', () => saveHeroImages().catch((e) => alert(String(e))));

  subscribeStore(refreshAll);
  subscribeOrders(refreshAll);
  refreshAll();
  initCharts();
});
