import { initShell, wireMobileMenu, wireGlobalSearch } from './storefront/shell.js';
import { initHero } from './storefront/hero.js';
import { initBackendIntegration } from './shared/backend-init.js';
import { login, logout, getSession, setSession } from './shared/account.js';
import {
  getActiveProducts,
  getStore,
  subscribeStore,
  getCart,
  saveCart,
  saveWishlist,
  saveOrders,
  cartSubtotal,
  getWishlist,
  getProductById,
  appendOrder,
  getOrders,
  subscribeWishlist,
  subscribeCart,
  subscribeOrders,
  wishlistHas,
  toggleWishlist
} from './shared/store.js';
import { buildProductCard, bindProductCardRoot, priceHtml, placeholderImage } from './storefront/product-ui.js';
import { cartAPI, wishlistAPI, ordersAPI } from './shared/api.js';
import { escapeHtml } from './shared/dom.js';
import { formatKSh } from './shared/format.js';
import { bumpQuantity, removeLine, addToCartByProductId } from './storefront/cart-ops.js';
import { validateKenyaMobile, validateRequired, normalizeMobileDigits } from './shared/validators.js';

const page = document.body.dataset.page || '';

function $(sel, root = document) {
  return root.querySelector(sel);
}

function $all(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function normalizeAssetUrl(url) {
  const value = String(url || '').trim();
  if (!value) return null;
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) return value;
  if (value.startsWith('/')) return `http://localhost:3000${value}`;
  return value;
}

function normalizeCartItem(item) {
  return {
    productId: String(item.product_id || item.productId || ''),
    name: item.name,
    quantity: Number(item.quantity || 0),
    unitPrice: Number(item.unit_price || item.unitPrice || 0),
    image: normalizeAssetUrl(item.image),
    productUrl: item.product_url || item.productUrl || `product.html?id=${encodeURIComponent(item.product_id || item.productId)}`
  };
}

function normalizeWishlistItem(item) {
  return {
    productId: item.product_id || item.productId,
    addedAt: item.added_at || item.addedAt || new Date().toISOString()
  };
}

async function syncCartFromBackend() {
  const session = getSession();
  if (!session?.id) return;
  try {
    const items = await cartAPI.get(session.id);
    saveCart(items.map(normalizeCartItem));
  } catch (error) {
    console.warn('Could not sync cart from backend:', error.message);
  }
}

async function syncWishlistFromBackend() {
  const session = getSession();
  if (!session?.id) return;
  try {
    const items = await wishlistAPI.get(session.id);
    saveWishlist(items.map(normalizeWishlistItem));
  } catch (error) {
    console.warn('Could not sync wishlist from backend:', error.message);
  }
}

async function syncAccountOrdersFromBackend() {
  const session = getSession();
  if (!session?.id) return;
  try {
    const orders = await ordersAPI.getByUserId(session.id);
    saveOrders(orders || []);
  } catch (error) {
    console.warn('Could not sync account orders from backend:', error.message);
  }
}

function renderProductGrid(el, products) {
  if (!el) return;
  el.innerHTML = products.map(buildProductCard).join('');
  bindProductCardRoot(el);
}

function paintHomeGrids() {
  const best = $('#bestSellersGrid');
  const neu = $('#newArrivalsGrid');
  const list = getActiveProducts();
  const featured = [...list].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews).slice(0, 8);
  const newest = list.filter((p) => p.badge === 'New' || p.badge === 'Organic');
  const newArrivals = [...newest, ...list.filter((p) => !newest.includes(p))].slice(0, 4);
  renderProductGrid(best, featured);
  renderProductGrid(neu, newArrivals);
}

function homePage() {
  paintHomeGrids();
  const heroRoot = /** @type {HTMLElement|null} */ ($('#heroRoot'));
  const offHero = initHero(heroRoot);
  const offStore = subscribeStore(paintHomeGrids);
  const offWish = subscribeWishlist(paintHomeGrids);
  return () => {
    offHero();
    offStore();
    offWish();
  };
}

function productsPage() {
  const grid = $('#catalogGrid');
  const empty = $('.empty-state');
  const results = $('.results-count');
  const searchInput = $('.filters-bar .search-input input');
  const sortSelect = $('.filters-bar select');
  const catButtons = $all('.sidebar-filters .filter-btn');

  const params = new URLSearchParams(window.location.search);
  const state = {
    category: params.get('category') || 'All',
    query: params.get('q') || '',
    sort: params.get('sort') || (sortSelect ? sortSelect.value : 'popularity')
  };

  if (searchInput) searchInput.value = state.query;
  if (sortSelect) sortSelect.value = state.sort;

  function visibleList() {
    const q = state.query.trim().toLowerCase();
    let rows = getActiveProducts();
    if (state.category !== 'All') rows = rows.filter((p) => p.category === state.category);
    if (q) rows = rows.filter((p) => `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(q));
    const key = (state.sort || '').toLowerCase();
    rows = [...rows].sort((a, b) => {
      if (key === 'price-asc') return a.currentPrice - b.currentPrice;
      if (key === 'price-desc') return b.currentPrice - a.currentPrice;
      if (key === 'rating') return b.rating - a.rating || b.reviews - a.reviews;
      return a.sortOrder - b.sortOrder;
    });
    return rows;
  }

  function paint() {
    const rows = visibleList();
    renderProductGrid(grid, rows);
    if (results) results.textContent = `${rows.length} product${rows.length === 1 ? '' : 's'} found`;
    if (empty) empty.hidden = rows.length !== 0;
  }

  catButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.category = btn.dataset.category || btn.textContent.trim();
      catButtons.forEach((b) => b.classList.toggle('active', b === btn));
      paint();
    });
  });
  catButtons.forEach((b) => {
    const c = b.dataset.category || b.textContent.trim();
    b.classList.toggle('active', (state.category === 'All' && c === 'All') || state.category === c);
  });

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      state.query = searchInput.value;
      paint();
    });
  }
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      state.sort = sortSelect.value;
      paint();
    });
  }

  subscribeStore(paint);
  subscribeWishlist(paint);
  paint();
  return () => {};
}

function productDetailPage() {
  const root = $('#productDetailRoot');
  const params = new URLSearchParams(window.location.search);
  let id = params.get('id');
  if (!id) {
    const legacy = params.get('product');
    if (legacy) {
      const found =
        getActiveProducts().find((x) => x.name === legacy) || getStore().products.find((x) => x.name === legacy);
      id = found?.id || null;
    }
  }
  const p = id ? getProductById(id) : null;
  if (!root) return () => {};
  if (!p || !p.active) {
    root.innerHTML = `<div class="empty-state"><p>Product not found.</p><a class="btn btn-primary btn-sm" href="products.html">Back to products</a></div>`;
    return () => {};
  }

  document.title = `${p.name} — ${getStore().settings.storeName}`;

  const imgs = (p.images || []).slice(0, 6);
  const main = imgs[0] || placeholderImage(p.name);
  const thumbs = imgs
    .map(
      (src, i) =>
        `<button type="button" class="gallery-thumb${i === 0 ? ' is-active' : ''}" data-gallery="${i}" aria-label="Show image ${i + 1}"><img src="${escapeHtml(src)}" alt="" /></button>`
    )
    .join('');

  const showRating = !!getStore().settings.flags?.showRatingStars;
  const stock = p.stock ?? 0;
  const out = stock === 0;
  const filled = Math.max(0, Math.min(5, Math.round(p.rating)));

  root.innerHTML = `
    <a href="products.html" class="back-link">Back to products</a>
    <div class="detail-grid">
      <div>
        <div class="gallery-main"><img id="galleryMain" src="${escapeHtml(main)}" alt="${escapeHtml(p.name)}" /></div>
        <div class="gallery-thumbs" role="tablist">${thumbs}</div>
      </div>
      <div>
        <span class="detail-badge">${escapeHtml(p.badge || p.category)}</span>
        <h1 class="detail-title">${escapeHtml(p.name)}</h1>
        ${
          showRating
            ? `<div class="detail-rating"><span class="stars" aria-hidden="true">${'★'.repeat(filled)}${'☆'.repeat(5 - filled)}</span><strong>${Number(p.rating).toFixed(1)}</strong><span class="muted">(${p.reviews} reviews)</span></div>`
            : ''
        }
        <div class="detail-price">${priceHtml(p)}</div>
        <p class="detail-unit muted">${escapeHtml(p.unit)}</p>
        <p class="detail-desc">${escapeHtml(p.description)}</p>
        <div class="stock-status"><span class="stock-dot ${out ? 'out' : 'in-stock'}"></span><span>${out ? 'Out of stock' : 'In stock'}</span></div>
        <div class="qty-selector">
          <label for="qtyField">Quantity</label>
          <div class="qty-controls">
            <button type="button" data-qty="-1" aria-label="Decrease quantity">−</button>
            <input id="qtyField" class="qty-input" type="number" min="1" max="${Math.max(1, stock)}" value="1" />
            <button type="button" data-qty="1" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <div class="detail-actions">
          <button type="button" class="btn btn-primary btn-lg" id="pdpAdd" ${out ? 'disabled' : ''}>Add to cart</button>
          <button type="button" class="btn btn-outline btn-lg wishlist-heart" id="pdpWish" aria-pressed="false" aria-label="Wishlist"><span class="wishlist-heart-icon" aria-hidden="true"></span> Wishlist</button>
        </div>
      </div>
    </div>
  `;

  const mainImg = /** @type {HTMLImageElement} */ ($('#galleryMain', root));
  $all('.gallery-thumb', root).forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = Number(btn.getAttribute('data-gallery'));
      const src = imgs[i];
      if (mainImg && src) mainImg.src = src;
      $all('.gallery-thumb', root).forEach((b) => b.classList.toggle('is-active', b === btn));
    });
  });

  const qtyInput = /** @type {HTMLInputElement|null} */ ($('#qtyField', root));
  root.querySelectorAll('[data-qty]').forEach((b) => {
    b.addEventListener('click', () => {
      const d = Number(/** @type {HTMLElement} */ (b).getAttribute('data-qty'));
      if (!qtyInput) return;
      const max = Number(qtyInput.max) || 999;
      const next = Math.max(1, Math.min(max, (Number(qtyInput.value) || 1) + d));
      qtyInput.value = String(next);
    });
  });

  const wishBtn = /** @type {HTMLButtonElement|null} */ ($('#pdpWish', root));
  const syncWish = () => {
    const on = wishlistHas(p.id);
    wishBtn?.classList.toggle('is-active', on);
    wishBtn?.setAttribute('aria-pressed', on ? 'true' : 'false');
  };
  syncWish();
  wishBtn?.addEventListener('click', () => {
    toggleWishlist(p.id);
    syncWish();
  });

  $('#pdpAdd', root)?.addEventListener('click', () => {
    const q = Math.max(1, Number(qtyInput?.value) || 1);
    addToCartByProductId(p.id, q);
  });

  return () => {};
}

function cartPage() {
  const listEl = $('#cartItemsList');
  const subEl = $('#cartSubtotal');
  const shipEl = $('#cartShipping');
  const totEl = $('#cartTotal');
  const checkoutBtn = $('#goCheckout');

  function paint() {
    const items = getCart();
    if (!listEl) return;
    if (!items.length) {
      listEl.innerHTML =
        '<div class="empty-state"><p>Your cart is empty.</p><a class="btn btn-primary btn-sm" href="products.html">Browse products</a></div>';
      if (checkoutBtn) checkoutBtn.setAttribute('disabled', 'true');
    } else {
      if (checkoutBtn) checkoutBtn.removeAttribute('disabled');
      listEl.innerHTML = items
        .map((it) => {
          const img = it.image || placeholderImage(it.name || 'Product');
          return `
          <div class="cart-item" data-cart-line="${escapeHtml(it.productId)}">
            <img src="${escapeHtml(img)}" alt="" width="80" height="80" />
            <div class="cart-item-info">
              <a class="name" href="${escapeHtml(it.productUrl)}">${escapeHtml(it.name)}</a>
              <div class="muted">${formatKSh(it.unitPrice)} each</div>
              <div class="cart-item-bottom">
                <div class="cart-qty">
                  <button type="button" data-dec="${escapeHtml(it.productId)}" aria-label="Decrease">−</button>
                  <span>${it.quantity}</span>
                  <button type="button" data-inc="${escapeHtml(it.productId)}" aria-label="Increase">+</button>
                </div>
                <button type="button" class="remove-btn" data-remove="${escapeHtml(it.productId)}">Remove</button>
              </div>
            </div>
            <div class="cart-line-total">${formatKSh(it.unitPrice * it.quantity)}</div>
          </div>`;
        })
        .join('');

      listEl.querySelectorAll('[data-inc]').forEach((b) => {
        b.addEventListener('click', () => bumpQuantity(b.getAttribute('data-inc'), 1));
      });
      listEl.querySelectorAll('[data-dec]').forEach((b) => {
        b.addEventListener('click', () => bumpQuantity(b.getAttribute('data-dec'), -1));
      });
      listEl.querySelectorAll('[data-remove]').forEach((b) => {
        b.addEventListener('click', () => removeLine(b.getAttribute('data-remove')));
      });
    }

    const sub = cartSubtotal(items);
    const ship = sub > 0 ? 2500 : 0;
    if (subEl) subEl.textContent = formatKSh(sub);
    if (shipEl) shipEl.textContent = formatKSh(ship);
    if (totEl) totEl.textContent = formatKSh(sub + ship);
  }

  subscribeStore(paint);
  subscribeCart(paint);
  paint();
  checkoutBtn?.addEventListener('click', () => {
    window.location.href = 'checkout.html';
  });
  return () => {};
}

function checkoutPage() {
  const form = /** @type {HTMLFormElement|null} */ ($('#checkoutForm'));
  const err = $('#checkoutErrors');
  if (!form) return () => {};

  function showErrors(messages) {
    if (!err) return;
    if (!messages.length) {
      err.hidden = true;
      err.innerHTML = '';
      return;
    }
    err.hidden = false;
    err.innerHTML = `<ul>${messages.map((m) => `<li>${escapeHtml(m)}</li>`).join('')}</ul>`;
  }


  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const fullName = String(fd.get('fullName') || '');
    const mobile = String(fd.get('mobile') || '');
    const county = String(fd.get('county') || '');
    const addressLine = String(fd.get('addressLine') || '');
    const notes = String(fd.get('notes') || '');

    const messages = [
      validateRequired(fullName, 'Full name'),
      validateKenyaMobile(mobile),
      validateRequired(county, 'County'),
      validateRequired(addressLine, 'Address')
    ].filter(Boolean);

    if (messages.length) {
      showErrors(messages);
      return;
    }

    const items = getCart();
    if (!items.length) {
      showErrors(['Your cart is empty.']);
      return;
    }

    const lines = items.map((i) => ({
      productId: i.productId,
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice
    }));
    const subtotal = cartSubtotal(items);

    const session = getSession();
    const orderPayload = {
      userId: session?.id || null,
      customerName: fullName.trim(),
      mobile: normalizeMobileDigits(mobile),
      email: session?.email || null,
      county: county.trim(),
      addressLine: addressLine.trim(),
      notes: notes.trim() || null,
      items: lines,
      subtotal,
      deliveryFee: 2500
    };

    let orderId = null;
    let orderStatus = 'pending';
    let paymentResponse = null;
    const ok = $('#checkoutSuccess');

    try {
      if (session?.id) {
        const result = await ordersAPI.create(orderPayload);
        orderId = result.id || result.orderId || orderPayload.id;
        orderStatus = 'payment_pending';
        await cartAPI.clear(session.id);
        saveCart([]);
        await syncAccountOrdersFromBackend();

        // --- MPESA PAYMENT INTEGRATION ---
        if (ok) {
          ok.hidden = false;
          ok.innerHTML = `<div class="spinner" style="margin:2rem auto"></div>
            <h2>Processing payment...</h2>
            <p class="muted">Sending M-Pesa prompt to <strong>${escapeHtml(mobile)}</strong> for <strong>${formatKSh(subtotal + 2500)}</strong>.</p>
            <p class="muted">Please check your phone and enter your M-Pesa PIN.</p>`;
        }
        showErrors([]);

        try {
          const { paymentsAPI } = await import('./shared/api.js');
          paymentResponse = await paymentsAPI.initiateSTK(orderId, session.id, normalizeMobileDigits(mobile), subtotal + 2500);
          if (ok) {
            ok.innerHTML = `<h2>Payment prompt sent</h2>
              <p class="muted">Check your phone and enter your M-Pesa PIN to complete payment.</p>
              <p class="muted">Order: <strong>${escapeHtml(orderId)}</strong></p>
              <p class="muted">Amount: <strong>${formatKSh(subtotal + 2500)}</strong></p>
              <p><a class="btn btn-primary btn-sm" href="account.html">View account</a> <a class="btn btn-outline btn-sm" href="products.html">Continue shopping</a></p>`;
          }
        } catch (mpesaErr) {
          if (ok) {
            ok.innerHTML = `<h2>Payment failed</h2>
              <p class="muted">${escapeHtml(mpesaErr.message || 'Failed to send M-Pesa prompt.')}</p>
              <p><a class="btn btn-primary btn-sm" href="account.html">View account</a> <a class="btn btn-outline btn-sm" href="products.html">Continue shopping</a></p>`;
          }
        }
        return;
      } else {
        // Demo/local order (no backend)
        const order = {
          id: `ORD-${Date.now()}`,
          createdAt: new Date().toISOString(),
          customerName: fullName.trim(),
          mobile: normalizeMobileDigits(mobile),
          county: county.trim(),
          addressLine: addressLine.trim(),
          notes: notes.trim() || null,
          lines,
          subtotal,
          status: 'payment_pending'
        };
        appendOrder(order);
        saveCart([]);
        orderId = order.id;
        if (ok) {
          ok.hidden = false;
          ok.innerHTML = `<h2>Order placed (demo)</h2>
            <p class="muted">Thank you, <strong>${escapeHtml(fullName.trim())}</strong>. Your order <strong>${escapeHtml(orderId)}</strong> is being processed (no real payment).</p>
            <p><a class="btn btn-primary btn-sm" href="account.html">View account</a> <a class="btn btn-outline btn-sm" href="products.html">Continue shopping</a></p>`;
        }
        showErrors([]);
        return;
      }
    } catch (error) {
      console.error('Checkout failed:', error.message);
      showErrors([`Unable to place order: ${error.message}`]);
      return;
    }
  });

  return () => {};
}

function wishlistPage() {
  const grid = $('#wishlistGrid');
  function paint() {
    if (!grid) return;
    const ids = getWishlist().map((w) => w.productId);
    const products = ids.map((id) => getProductById(id)).filter(Boolean);
    if (!products.length) {
      grid.innerHTML =
        '<div class="empty-state"><p>Your wishlist is empty.</p><a class="btn btn-primary btn-sm" href="products.html">Browse products</a></div>';
      return;
    }
    renderProductGrid(grid, /** @type {any[]} */ (products));
  }
  subscribeStore(paint);
  subscribeWishlist(paint);
  paint();
  return () => {};
}

function accountPage() {
  const guest = $('#accountGuest');
  const app = $('#accountApp');
  const ordersEl = $('#accountOrders');

  async function refreshOrders() {
    const session = getSession();
    if (!session?.id) return;
    try {
      const orders = await ordersAPI.getByUserId(session.id);
      saveOrders(orders || []);
      paint();
    } catch (error) {
      console.warn('Unable to refresh account orders:', error.message);
    }
  }

  function paint() {
    const s = getSession();
    if (!s) {
      guest?.removeAttribute('hidden');
      app?.setAttribute('hidden', '');
      return;
    }
    guest?.setAttribute('hidden', '');
    app?.removeAttribute('hidden');
    $('#acctEmail') && ($('#acctEmail').textContent = s.email);
    $('#acctName') && ($('#acctName').textContent = s.fullName);

    const mine = getOrders();
    if (ordersEl) {
      if (!mine.length) {
        ordersEl.innerHTML = '<p class="muted">No orders yet.</p>';
      } else {
        ordersEl.innerHTML = `<div class="table-wrap"><table class="acct-table"><thead><tr><th>Order</th><th>Date</th><th>Total</th><th>Status</th></tr></thead><tbody>${mine
          .map(
            (o) => {
              const createdAt = o.createdAt || o.created_at || '';
              const subtotal = o.subtotal != null ? o.subtotal : o.total_amount || 0;
              const status = o.status || o.order_status || 'unknown';
              return `<tr><td>${escapeHtml(o.id)}</td><td>${escapeHtml(String(createdAt).slice(0, 10))}</td><td>${formatKSh(
                subtotal
              )}</td><td>${escapeHtml(status)}</td></tr>`;
            }
          )
          .join('')}</tbody></table></div>`;
      }
    }
  }

  $('#acctSignout')?.addEventListener('click', () => {
    logout();
    paint();
  });

  paint();
  refreshOrders();
  subscribeStore(paint);
  subscribeOrders(paint);
  return () => {};
}

function signInPage() {
  const form = /** @type {HTMLFormElement|null} */ ($('#signInForm'));
  const err = $('#signInError');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const email = String(fd.get('email') || '').trim().toLowerCase();
    const password = String(fd.get('password') || '');
    const fullName = String(fd.get('fullName') || '').trim() || 'User';

    if (!email) {
      if (err) err.textContent = 'Email is required.';
      return;
    }

    try {
      // Try backend login first
      if (err) err.textContent = 'Signing in...';
      
      await login(email, password, fullName);
      
      if (err) err.textContent = '';
      window.location.href = 'account.html';
    } catch (loginError) {
      console.error('Backend login error:', loginError.message);
      
      // Fallback to demo login for testing
      const isDemoEmail = email === 'demo@agromart.com';
      const isFixedDemo = email === 'demo@agro.test' && password === 'demo123';

      if (isDemoEmail || isFixedDemo) {
        console.log('✅ Using demo authentication (backend offline)');
        setSession({ email, fullName, isDemo: true });
        if (err) err.textContent = '';
        window.location.href = 'account.html';
      } else {
        if (err)
          err.textContent = `Sign in failed: ${loginError.message}. Or use demo@agromart.com (any password) for testing.`;
      }
    }
  });
  return () => {};
}

function signUpPage() {
  const form = /** @type {HTMLFormElement|null} */ ($('#signUpForm'));
  const err = $('#signUpError');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const email = String(fd.get('email') || '').trim().toLowerCase();
    const fullName = String(fd.get('fullName') || '').trim();
    const password = String(fd.get('password') || '');
    const confirmPassword = String(fd.get('confirmPassword') || '');

    // Basic validation
    if (!email || !fullName || !password) {
      if (err) err.textContent = 'All fields are required.';
      return;
    }

    if (password !== confirmPassword) {
      if (err) err.textContent = 'Passwords do not match.';
      return;
    }

    if (password.length < 6) {
      if (err) err.textContent = 'Password must be at least 6 characters.';
      return;
    }

    try {
      if (err) err.textContent = 'Creating account...';
      
      await import('./shared/account.js').then(acc => acc.register(email, fullName, password));
      
      if (err) err.textContent = '';
      window.location.href = 'account.html';
    } catch (error) {
      console.error('Registration error:', error);
      if (err) err.textContent = `Registration failed: ${error.message}`;
    }
  });
  return () => {};
}

function boot() {
  const stopShell = initShell();
  wireMobileMenu();
  wireGlobalSearch();

  /** @type {(() => void)[]} */
  const stops = [stopShell];

  if (page === 'home') stops.push(homePage());
  else if (page === 'products') stops.push(productsPage());
  else if (page === 'product') stops.push(productDetailPage());
  else if (page === 'cart') stops.push(cartPage());
  else if (page === 'checkout') stops.push(checkoutPage());
  else if (page === 'wishlist') stops.push(wishlistPage());
  else if (page === 'account') stops.push(accountPage());
  else if (page === 'sign-in') stops.push(signInPage());
  else if (page === 'sign-up') stops.push(signUpPage());

  window.addEventListener('beforeunload', () => stops.forEach((fn) => fn && fn()));
}

// Initialize backend connection and then boot
(async () => {
  console.log('🚀 AGROMART Storefront Starting...');
  await initBackendIntegration();
  await syncCartFromBackend();
  await syncWishlistFromBackend();
  await syncAccountOrdersFromBackend();
  boot();
})();
