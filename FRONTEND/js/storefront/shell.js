import { getSettings, subscribeStore, getCart, cartQtyTotal, getWishlist, subscribeCart, subscribeWishlist } from '../shared/store.js';

function setAll(sel, text) {
  document.querySelectorAll(sel).forEach((el) => {
    el.textContent = text;
  });
}

export function refreshShell() {
  const s = getSettings();
  setAll('[data-site-brand]', s.storeName);
  setAll('[data-support-phone]', s.supportPhone);
  const cq = cartQtyTotal(getCart());
  setAll('[data-cart-count]', String(cq));
  const wq = getWishlist().length;
  setAll('[data-wishlist-count]', String(wq));
}

export function initShell() {
  refreshShell();
  const offs = [
    subscribeStore(refreshShell),
    subscribeCart(refreshShell),
    subscribeWishlist(refreshShell)
  ];
  return () => offs.forEach((fn) => fn());
}

export function wireMobileMenu() {
  const btn = document.querySelector('[data-mobile-menu-toggle]');
  const menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => {
    const open = !menu.classList.contains('active');
    menu.classList.toggle('active', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

export function wireGlobalSearch() {
  const go = (q) => {
    const url = new URL('products.html', window.location.href);
    if (q.trim()) url.searchParams.set('q', q.trim());
    window.location.href = url.toString();
  };
  document.querySelectorAll('[data-global-search], [data-global-search-mobile]').forEach((input) => {
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      go(/** @type {HTMLInputElement} */ (input).value);
    });
  });
}
