import { getCart, getProductById, saveCart, cartQtyTotal } from '../shared/store.js';
import { getSession } from '../shared/account.js';
import { cartAPI } from '../shared/api.js';

function normalizeAssetUrl(url) {
  const value = String(url || '').trim();
  if (!value) return null;
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) return value;
  if (value.startsWith('/')) return `http://localhost:3000${value}`;
  return value;
}

function toast(msg) {
  let el = document.querySelector('.toast-host');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast-host';
    document.body.appendChild(el);
  }
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  el.appendChild(t);
  requestAnimationFrame(() => t.classList.add('is-visible'));
  setTimeout(() => {
    t.classList.remove('is-visible');
    setTimeout(() => t.remove(), 300);
  }, 2200);
}

async function mapBackendCartItems(items = []) {
  return items.map((item) => ({
    productId: String(item.product_id || item.productId || ''),
    name: item.name,
    unitPrice: Number(item.unit_price || item.unitPrice || 0),
    quantity: Number(item.quantity || 0),
    image: normalizeAssetUrl(item.image),
    productUrl: item.product_url || item.productUrl || `product.html?id=${encodeURIComponent(item.product_id || item.productId)}`
  }));
}

async function refreshBackendCart(userId) {
  if (!userId) return null;
  try {
    const backendItems = await cartAPI.get(userId);
    const mapped = await mapBackendCartItems(backendItems);
    saveCart(mapped);
    return mapped;
  } catch (error) {
    console.warn('Unable to sync cart from backend:', error.message);
    return null;
  }
}

function getBackendUserId() {
  const session = getSession();
  return session?.id || null;
}

export async function addToCartByProductId(productId, quantity) {
  const normalizedProductId = String(productId);
  const p = getProductById(normalizedProductId);
  if (!p || !p.active) {
    toast('Product unavailable.');
    return;
  }
  const stock = p.stock ?? 999999;
  if (stock <= 0) {
    toast('Out of stock.');
    return;
  }

  const userId = getBackendUserId();
  if (userId) {
    try {
      await cartAPI.add(userId, normalizedProductId, quantity);
      const items = (await refreshBackendCart(userId)) || getCart();
      toast(`Added to cart (${cartQtyTotal(items)} items)`);
      return;
    } catch (error) {
      console.warn('Backend cart add failed, falling back to local cart.', error.message);
    }
  }

  const items = [...getCart()];
  const idx = items.findIndex((i) => String(i.productId) === normalizedProductId);
  const prev = idx >= 0 ? items[idx].quantity : 0;
  const nextQty = Math.min(stock, prev + quantity);
  const line = {
    productId: String(p.id),
    name: p.name,
    unitPrice: p.currentPrice,
    quantity: nextQty,
    image: normalizeAssetUrl(p.images?.[0]) || null,
    productUrl: `product.html?id=${encodeURIComponent(p.id)}`
  };
  if (idx >= 0) items[idx] = line;
  else items.push(line);
  saveCart(items);
  toast(`Added to cart (${cartQtyTotal(items)} items)`);
}

export async function setLineQuantity(productId, quantity) {
  const normalizedProductId = String(productId);
  const p = getProductById(normalizedProductId);
  const stock = p?.stock ?? 999999;
  const q = Math.max(0, Math.min(stock, Math.floor(quantity)));
  const userId = getBackendUserId();

  if (userId) {
    try {
      await cartAPI.update(userId, normalizedProductId, q);
      await refreshBackendCart(userId);
      return;
    } catch (error) {
      console.warn('Backend cart update failed, falling back to local cart.', error.message);
    }
  }

  const items = [...getCart()];
  if (q === 0) {
    saveCart(items.filter((i) => String(i.productId) !== normalizedProductId));
    return;
  }
  if (!p) return;
  const idx = items.findIndex((i) => String(i.productId) === normalizedProductId);
  const base =
    idx >= 0
      ? items[idx]
      : {
          productId: String(p.id),
          name: p.name,
          unitPrice: p.currentPrice,
          image: normalizeAssetUrl(p.images?.[0]) || null,
          productUrl: `product.html?id=${encodeURIComponent(p.id)}`
        };
  const next = { ...base, quantity: q };
  if (idx >= 0) items[idx] = next;
  else items.push(next);
  saveCart(items);
}

export async function bumpQuantity(productId, delta) {
  const normalizedProductId = String(productId);
  const cur = getCart().find((i) => String(i.productId) === normalizedProductId);
  return setLineQuantity(normalizedProductId, (cur?.quantity ?? 0) + delta);
}

export async function removeLine(productId) {
  const normalizedProductId = String(productId);
  const userId = getBackendUserId();
  if (userId) {
    try {
      await cartAPI.remove(userId, normalizedProductId);
      await refreshBackendCart(userId);
      return;
    } catch (error) {
      console.warn('Backend cart remove failed, falling back to local cart.', error.message);
    }
  }
  saveCart(getCart().filter((i) => String(i.productId) !== normalizedProductId));
}
