/**
 * AgroMart client persistence (prototype). Admin + storefront share keys on the same origin.
 *
 * STORAGE SCHEMA
 * --------------
 * agromart_store_v1  →  { version: 1, settings, products }
 *   settings: { storeName, supportPhone, heroHeadline, heroSubcopy, heroCtaLabel, heroCtaHref,
 *                heroImages: [url|null, url|null, url|null], flags: { showRatingStars } }
 *   products: Product[]
 *
 * agromart_cart_v1   →  CartItem[]
 * agromart_wishlist_v1 →  WishlistItem[]  // { productId, addedAt }
 * agromart_orders_v1 →  Order[]
 * agromart_session_v1 →  { email, fullName, isDemo } | null
 *
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} category
 * @property {number} currentPrice
 * @property {number|null} originalPrice
 * @property {string|null} sku
 * @property {number|null} stock
 * @property {boolean} active
 * @property {string[]} images
 * @property {number} sortOrder
 * @property {string} unit
 * @property {string|null} badge
 * @property {string|null} discountLabel
 * @property {number} rating
 * @property {number} reviews
 *
 * @typedef {Object} CartItem
 * @property {string} productId
 * @property {string} name
 * @property {number} unitPrice
 * @property {number} quantity
 * @property {string|null} image
 * @property {string} productUrl
 *
 * @typedef {Object} WishlistItem
 * @property {string} productId
 * @property {string} addedAt
 *
 * @typedef {Object} OrderLine
 * @property {string} productId
 * @property {string} name
 * @property {number} quantity
 * @property {number} unitPrice
 *
 * @typedef {Object} Order
 * @property {string} id
 * @property {string} createdAt
 * @property {string} customerName
 * @property {string} mobile
 * @property {string} county
 * @property {string} addressLine
 * @property {string|null} notes
 * @property {OrderLine[]} lines
 * @property {number} subtotal
 * @property {string} status
 */

import { getSession } from './account.js';
import { wishlistAPI } from './api.js';

const KEY_STORE = 'agromart_store_v1';
const KEY_CART = 'agromart_cart_v1';
const KEY_WISHLIST = 'agromart_wishlist_v1';
const KEY_ORDERS = 'agromart_orders_v1';
const KEY_SESSION = 'agromart_session_v1';

const EVT_STORE = 'agromart:store';
const EVT_CART = 'agromart:cart';
const EVT_WISHLIST = 'agromart:wishlist';
const EVT_ORDERS = 'agromart:orders';
const EVT_SESSION = 'agromart:session';

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function emit(name) {
  window.dispatchEvent(new CustomEvent(name));
}

function ph(label) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#3a7d44"/><stop offset="100%" stop-color="#c8842a"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-family="system-ui,sans-serif" font-size="28">${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function productBase(seed) {
  const images = seed.images && seed.images.length ? seed.images : [ph(seed.name)];
  return {
    sku: seed.sku ?? null,
    stock: seed.stock ?? 0,
    active: seed.active !== false,
    images,
    discountLabel: seed.discountLabel ?? null,
    badge: seed.badge ?? null,
    unit: seed.unit ?? 'each',
    rating: seed.rating ?? 4.5,
    reviews: seed.reviews ?? 0,
    description: seed.description ?? '',
    ...seed,
    images
  };
}

const DEFAULT_STORE = {
  version: 1,
  settings: {
    storeName: 'AgroMart',
    supportPhone: '+254 700 000 000',
    heroHeadline: 'Everything your farm needs',
    heroSubcopy: 'Quality inputs and tools — prototype storefront (local data only).',
    heroCtaLabel: 'Shop now',
    heroCtaHref: 'products.html',
    heroImages: [ph('Hero 1'), ph('Hero 2'), ph('Hero 3')],
    flags: { showRatingStars: true }
  },
  products: [
    productBase({
      id: 'seed-maize',
      sortOrder: 10,
      name: 'Premium Maize Seeds (5kg)',
      description: 'High-germination hybrid maize for main-season planting.',
      category: 'Seeds & Seedlings',
      currentPrice: 2500,
      originalPrice: 3200,
      stock: 24,
      unit: 'per bag',
      badge: 'Best Seller',
      discountLabel: '-22%',
      rating: 4.8,
      reviews: 124
    }),
    productBase({
      id: 'seed-npk',
      sortOrder: 20,
      name: 'NPK 15-15-15 Fertilizer (50kg)',
      description: 'Balanced NPK for basal and top dressing.',
      category: 'Fertilizers',
      currentPrice: 18500,
      originalPrice: null,
      stock: 18,
      rating: 4.6,
      reviews: 89
    }),
    productBase({
      id: 'seed-chicks',
      sortOrder: 30,
      name: 'Broiler Day-Old Chicks (100pcs)',
      description: 'Healthy day-old broilers from verified hatcheries.',
      category: 'Livestock',
      currentPrice: 45000,
      originalPrice: 52000,
      stock: 75,
      badge: 'Popular',
      discountLabel: '-13%',
      rating: 4.9,
      reviews: 56
    }),
    productBase({
      id: 'seed-sprayer',
      sortOrder: 40,
      name: 'Knapsack Sprayer (16L)',
      description: 'Durable manual knapsack sprayer.',
      category: 'Tools & Equipment',
      currentPrice: 8500,
      originalPrice: null,
      stock: 12,
      rating: 4.5,
      reviews: 73
    }),
    productBase({
      id: 'seed-layers',
      sortOrder: 50,
      name: 'Poultry Feed Layers Mash (25kg)',
      description: 'Complete layers mash for steady production.',
      category: 'Animal Feed',
      currentPrice: 7800,
      originalPrice: 8500,
      stock: 36,
      discountLabel: '-8%',
      rating: 4.7,
      reviews: 95
    }),
    productBase({
      id: 'seed-glypho',
      sortOrder: 60,
      name: 'Glyphosate Herbicide (1L)',
      description: 'Non-selective systemic herbicide.',
      category: 'Pesticides & Herbicides',
      currentPrice: 3500,
      originalPrice: null,
      stock: 21,
      badge: 'Essential',
      rating: 4.4,
      reviews: 61
    }),
    productBase({
      id: 'seed-tomato',
      sortOrder: 70,
      name: 'Tomato Seedlings (Tray of 72)',
      description: 'Subject to seasonal availability.',
      category: 'Seeds & Seedlings',
      currentPrice: 1800,
      originalPrice: null,
      stock: 0,
      rating: 4.6,
      reviews: 42
    }),
    productBase({
      id: 'seed-cattle',
      sortOrder: 80,
      name: 'Cattle Feed Concentrate (50kg)',
      description: 'Energy and protein concentrate.',
      category: 'Animal Feed',
      currentPrice: 12000,
      originalPrice: null,
      stock: 16,
      rating: 4.5,
      reviews: 38
    }),
    productBase({
      id: 'seed-neem',
      sortOrder: 90,
      name: 'Organic Neem Oil Pesticide (500ml)',
      description: 'Botanical oil for soft-bodied pests.',
      category: 'Pesticides & Herbicides',
      currentPrice: 2800,
      originalPrice: null,
      stock: 30,
      badge: 'New',
      rating: 4.3,
      reviews: 12
    }),
    productBase({
      id: 'seed-melon',
      sortOrder: 100,
      name: 'Hybrid Watermelon Seeds (100g)',
      description: 'High-yielding hybrid seeds.',
      category: 'Seeds & Seedlings',
      currentPrice: 4500,
      originalPrice: null,
      stock: 40,
      badge: 'New',
      rating: 4.7,
      reviews: 8
    }),
    productBase({
      id: 'seed-pump',
      sortOrder: 110,
      name: 'Solar-Powered Water Pump',
      description: 'DC surface pump kit for smallholder irrigation.',
      category: 'Tools & Equipment',
      currentPrice: 85000,
      originalPrice: null,
      stock: 5,
      badge: 'New',
      rating: 4.9,
      reviews: 5
    }),
    productBase({
      id: 'seed-compost',
      sortOrder: 120,
      name: 'Organic Compost Fertilizer (25kg)',
      description: 'Mature compost to improve soil organic matter.',
      category: 'Fertilizers',
      currentPrice: 5500,
      originalPrice: null,
      stock: 14,
      badge: 'Organic',
      rating: 4.8,
      reviews: 15
    })
  ]
};

export function getStore() {
  const blob = readJson(KEY_STORE, null);
  if (!blob || blob.version !== 1 || !blob.settings || !Array.isArray(blob.products)) {
    writeJson(KEY_STORE, DEFAULT_STORE);
    emit(EVT_STORE);
    return JSON.parse(JSON.stringify(DEFAULT_STORE));
  }
  return JSON.parse(JSON.stringify(blob));
}

export function saveStore(next) {
  writeJson(KEY_STORE, next);
  emit(EVT_STORE);
}

export function subscribeStore(fn) {
  const a = () => fn();
  window.addEventListener(EVT_STORE, a);
  window.addEventListener('storage', (e) => {
    if (e.key === KEY_STORE || e.key === null) fn();
  });
  return () => window.removeEventListener(EVT_STORE, a);
}

export function getSettings() {
  return getStore().settings;
}

export function getActiveProducts() {
  return getStore()
    .products.filter((p) => p.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getProductById(id) {
  return getStore().products.find((p) => p.id === id);
}

export function getCart() {
  return readJson(KEY_CART, []);
}

export function saveCart(items) {
  writeJson(KEY_CART, items);
  emit(EVT_CART);
}

export function subscribeCart(fn) {
  const a = () => fn();
  window.addEventListener(EVT_CART, a);
  window.addEventListener('storage', (e) => {
    if (e.key === KEY_CART || e.key === null) fn();
  });
  return () => window.removeEventListener(EVT_CART, a);
}

export function cartQtyTotal(items) {
  return items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
}

export function cartSubtotal(items) {
  return items.reduce((s, i) => s + (Number(i.unitPrice) || 0) * (Number(i.quantity) || 0), 0);
}

export function getWishlist() {
  return readJson(KEY_WISHLIST, []);
}

export function saveWishlist(list) {
  writeJson(KEY_WISHLIST, list);
  emit(EVT_WISHLIST);
}

export function subscribeWishlist(fn) {
  const a = () => fn();
  window.addEventListener(EVT_WISHLIST, a);
  window.addEventListener('storage', (e) => {
    if (e.key === KEY_WISHLIST || e.key === null) fn();
  });
  return () => window.removeEventListener(EVT_WISHLIST, a);
}

export function wishlistHas(id) {
  return getWishlist().some((w) => w.productId === id);
}

export function toggleWishlist(productId) {
  const list = [...getWishlist()];
  const i = list.findIndex((w) => w.productId === productId);
  const session = getSession();
  const userId = session?.id || null;

  if (i >= 0) {
    list.splice(i, 1);
    saveWishlist(list);
    if (userId) {
      wishlistAPI.remove(userId, productId).catch((error) => {
        console.warn('Unable to remove wishlist item from backend:', error.message);
      });
    }
    return false;
  }

  list.push({ productId, addedAt: new Date().toISOString() });
  saveWishlist(list);
  if (userId) {
    wishlistAPI.add(userId, productId).catch((error) => {
      console.warn('Unable to add wishlist item to backend:', error.message);
    });
  }
  return true;
}

export function getOrders() {
  return readJson(KEY_ORDERS, []);
}

export function saveOrders(orders) {
  writeJson(KEY_ORDERS, orders);
  emit(EVT_ORDERS);
}

export function subscribeOrders(fn) {
  const a = () => fn();
  window.addEventListener(EVT_ORDERS, a);
  window.addEventListener('storage', (e) => {
    if (e.key === KEY_ORDERS || e.key === null) fn();
  });
  return () => window.removeEventListener(EVT_ORDERS, a);
}

export function appendOrder(order) {
  const all = [order, ...getOrders()];
  saveOrders(all);
}

export function subscribeSession(fn) {
  const a = () => fn();
  window.addEventListener(EVT_SESSION, a);
  window.addEventListener('storage', (e) => {
    if (e.key === KEY_SESSION || e.key === null) fn();
  });
  return () => window.removeEventListener(EVT_SESSION, a);
}
