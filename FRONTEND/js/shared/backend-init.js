/**
 * AgroMart Backend Integration Initializer
 * Syncs frontend localStorage with backend database on app startup
 * 
 * Usage:
 * import { initBackendIntegration } from './backend-init.js';
 * await initBackendIntegration();
 */

import { productsAPI, checkBackendHealth } from './api.js';
import { getStore, saveStore } from './store.js';

function normalizeImageUrl(url) {
  const value = String(url || '').trim();
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) return value;
  if (value.startsWith('/')) return `http://localhost:3000${value}`;
  return value;
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export async function initBackendIntegration() {
  console.log('🔄 Initializing backend integration...');

  // Check if backend is available
  const backendAvailable = await checkBackendHealth();
  console.log(`📡 Backend status: ${backendAvailable ? '✅ Connected' : '❌ Offline (using local data)'}`);

  if (!backendAvailable) {
    console.warn('⚠️  Backend not available. Using local cached data.');
    // Ensure default products are loaded
    const store = getStore();
    console.log(`📊 Current products in store: ${store.products.length}`);
    return false;
  }

  try {
    // Fetch products from backend
    console.log('📥 Fetching products from backend...');
    const backendProducts = await productsAPI.getAll();

    if (!Array.isArray(backendProducts) || backendProducts.length === 0) {
      console.warn('⚠️  No products received from backend, keeping current data');
      const store = getStore();
      console.log(`📊 Current products in store: ${store.products.length}`);
      return false;
    }

    console.log(`✅ Fetched ${backendProducts.length} products from backend`);
    console.log('📦 Sample product:', backendProducts[0]);

    // Transform backend products to frontend format
    const transformedProducts = backendProducts.map(p => {
      return {
        id: String(p.id || ''),
        name: String(p.name || 'Unknown'),
        description: String(p.description || ''),
        category: String(p.category_name || p.category || 'Other'),
        currentPrice: toNumberOrNull(p.current_price ?? p.currentPrice) ?? 0,
        originalPrice: toNumberOrNull(p.original_price ?? p.originalPrice),
        sku: p.sku || null,
        stock: parseInt(p.stock || 0),
        active: p.active !== false,
        sortOrder: p.sort_order || p.sortOrder || 0,
        unit: p.unit || 'each',
        badge: p.badge || null,
        discountLabel: p.discount_label || p.discountLabel || null,
        rating: parseFloat(p.rating || 4.5),
        reviews: parseInt(p.reviews || 0),
        images: (
          Array.isArray(p.images) ? p.images : (p.images ? [p.images] : [])
        )
          .map(normalizeImageUrl)
          .filter(Boolean)
      };
    });

    console.log('✅ Transformed products:', transformedProducts.length);

    // Update local store with backend products
    const store = getStore();
    store.products = transformedProducts;
    store.lastSync = new Date().toISOString();
    saveStore(store);

    console.log('💾 Updated local store with backend data');
    console.log('📊 Total products in store:', store.products.length);
    return true;
  } catch (error) {
    console.error('❌ Failed to sync with backend:', error.message);
    console.error('Stack:', error.stack);
    console.log('📦 Using local cached data instead');
    const store = getStore();
    console.log(`📊 Current products in store: ${store.products.length}`);
    return false;
  }
}

/**
 * Check if backend integration is healthy
 */
export async function checkIntegration() {
  const isHealthy = await checkBackendHealth();
  console.log(`Integration status: ${isHealthy ? '✅ OK' : '❌ Offline'}`);
  return isHealthy;
}

/**
 * Sync a specific resource with backend
 */
export async function syncResource(resourceType) {
  console.log(`🔄 Syncing ${resourceType}...`);
  
  switch (resourceType) {
    case 'products':
      return await initBackendIntegration();
    default:
      console.warn(`Unknown resource type: ${resourceType}`);
      return false;
  }
}

export default {
  initBackendIntegration,
  checkIntegration,
  syncResource
};
