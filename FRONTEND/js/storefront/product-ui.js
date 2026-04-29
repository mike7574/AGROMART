import { escapeHtml } from '../shared/dom.js';
import { formatKSh } from '../shared/format.js';
import { wishlistHas, toggleWishlist, getStore } from '../shared/store.js';
import { addToCartByProductId } from './cart-ops.js';

function ratingStars(rating) {
  const filled = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  let html = '';
  for (let i = 0; i < 5; i += 1) {
    html += `<span class="star${i < filled ? '' : ' empty'}" aria-hidden="true">★</span>`;
  }
  return html;
}

export function productUrl(p) {
  return `product.html?id=${encodeURIComponent(p.id)}`;
}

export function placeholderImage(label = 'AgroMart Product') {
  const safeLabel = escapeHtml(String(label));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#3a7d44"/><stop offset="100%" stop-color="#c8842a"/></linearGradient></defs><rect width="640" height="480" fill="url(#g)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-family="system-ui,sans-serif" font-size="28">${safeLabel}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function primaryImage(p) {
  return p.images?.[0] || placeholderImage(p.name);
}

export function priceHtml(p) {
  const cur = `<span class="current">${formatKSh(p.currentPrice)}</span>`;
  if (p.originalPrice != null && p.originalPrice > p.currentPrice) {
    return `${cur}<span class="original" aria-label="Was price">${formatKSh(p.originalPrice)}</span>`;
  }
  return cur;
}

export function buildProductCard(p) {
  const showRating = !!getStore().settings.flags?.showRatingStars;
  const url = productUrl(p);
  const img = primaryImage(p);
  const on = wishlistHas(p.id);
  const stock = p.stock ?? 0;
  const out = stock === 0;
  const badge = p.badge ? `<span class="product-badge">${escapeHtml(p.badge)}</span>` : '';
  const disc = p.discountLabel ? `<span class="product-discount-badge">${escapeHtml(p.discountLabel)}</span>` : '';
  const overlay = out ? '<div class="out-of-stock-overlay"><span>Out of stock</span></div>' : '';
  const ratingBlock = showRating
    ? `<div class="product-rating" aria-label="Rated ${escapeHtml(String(p.rating))} out of 5">${ratingStars(p.rating)}<strong>${Number(p.rating).toFixed(1)}</strong><span class="count">(${p.reviews})</span></div>`
    : '';

  return `
  <article class="product-card" data-product-id="${escapeHtml(p.id)}" data-category="${escapeHtml(p.category)}">
    <div class="product-card-img-wrap">
      <a href="${url}" class="product-card-img" aria-label="${escapeHtml(p.name)}">
        <img src="${escapeHtml(img)}" alt="" loading="lazy" width="640" height="480" />
        ${badge}${disc}${overlay}
      </a>
      <button type="button" class="wishlist-heart${on ? ' is-active' : ''}" data-wishlist="${escapeHtml(p.id)}"
        aria-pressed="${on ? 'true' : 'false'}" aria-label="${on ? 'Remove from wishlist' : 'Add to wishlist'}">
        <span class="wishlist-heart-icon" aria-hidden="true"></span>
      </button>
    </div>
    <div class="product-card-body">
      <a href="${url}"><h3>${escapeHtml(p.name)}</h3></a>
      ${ratingBlock}
      <div class="product-price">${priceHtml(p)}</div>
      <p class="product-unit">${escapeHtml(p.unit)}</p>
      <div class="product-stock ${out ? 'out' : stock <= 5 ? 'low' : 'in-stock'}">${out ? 'Out of stock' : `${stock} available`}</div>
      <div class="product-card-actions">
        <button type="button" class="btn btn-primary btn-sm" data-add-cart="${escapeHtml(p.id)}" ${out ? 'disabled' : ''}>${out ? 'Out of stock' : 'Add to cart'}</button>
        <a class="btn btn-outline btn-sm" href="${url}">Details</a>
      </div>
    </div>
  </article>`;
}

export function bindProductCardRoot(root) {
  root.addEventListener('click', (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    const wishBtn = t.closest('[data-wishlist]');
    if (wishBtn) {
      e.preventDefault();
      const id = wishBtn.getAttribute('data-wishlist');
      if (!id) return;
      const on = toggleWishlist(id);
      wishBtn.classList.toggle('is-active', on);
      wishBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      wishBtn.setAttribute('aria-label', on ? 'Remove from wishlist' : 'Add to wishlist');
      return;
    }
    const addBtn = t.closest('[data-add-cart]');
    if (addBtn && addBtn instanceof HTMLButtonElement && !addBtn.disabled) {
      e.preventDefault();
      const id = addBtn.getAttribute('data-add-cart');
      if (id) addToCartByProductId(id, 1);
    }
  });
}
