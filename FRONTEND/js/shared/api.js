/**
 * AgroMart Backend API Client
 * Handles all communication with backend
 */

// Detect backend URL - works locally from file:// as well as when served from localhost
const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
const API_BASE = isLocalDev ? 'http://localhost:3000/api' : `${window.location.origin}/api`;

// Utility to make API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  console.log(`📤 API Call: ${options.method || 'GET'} ${url}`);
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Add auth token if available
  const token = localStorage.getItem('agromart_auth_token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ API Response: ${endpoint}`, data);
    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
}

// Products API
export const productsAPI = {
  async getAll() {
    const result = await apiCall('/products');
    return result.data || result.products || [];
  },

  async getById(productId) {
    const result = await apiCall(`/products/${productId}`);
    return result.data || result;
  },

  async getByCategory(categoryName) {
    const result = await apiCall(`/products/category/${categoryName}`);
    return result.data || [];
  },

  async search(query) {
    const result = await apiCall(`/products/search/${query}`);
    return result.data || [];
  },

  async create(productData) {
    const result = await apiCall('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
    return result.data || result;
  },

  async update(productId, productData) {
    const result = await apiCall(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
    return result.data || result;
  },

  async delete(productId) {
    const result = await apiCall(`/products/${productId}`, {
      method: 'DELETE'
    });
    return result.data || result;
  }
};

export const uploadsAPI = {
  async uploadProductImages(files) {
    const list = Array.from(files || []);
    if (!list.length) return [];

    const formData = new FormData();
    list.forEach((file) => formData.append('images', file));

    const token = localStorage.getItem('agromart_auth_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await fetch(`${API_BASE}/uploads/products`, {
      method: 'POST',
      body: formData,
      headers,
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || error.message || `Upload failed: ${response.status}`);
    }

    const result = await response.json();
    return result?.data?.urls || [];
  }
};

// Orders API
export const ordersAPI = {
  async create(orderData) {
    const result = await apiCall('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
    return result.data || result;
  },

  async getById(orderId) {
    const result = await apiCall(`/orders/${orderId}`);
    return result.data || result;
  },

  async getByUserId(userId) {
    const result = await apiCall(`/orders/user/${userId}`);
    return result.data || result.orders || [];
  },

  async getAll() {
    const result = await apiCall('/orders');
    return result.data || result.orders || [];
  }
};

// Users API
export const usersAPI = {
  async register(userData) {
    const result = await apiCall('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    // Store token if provided
    if (result.token) {
      localStorage.setItem('agromart_auth_token', result.token);
    }
    return result.data || result;
  },

  async login(email, password) {
    const result = await apiCall('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    // Store token if provided
    if (result.token) {
      localStorage.setItem('agromart_auth_token', result.token);
    }
    return result.data || result;
  },

  logout() {
    localStorage.removeItem('agromart_auth_token');
  }
};

// Cart API
export const cartAPI = {
  async get(userId) {
    const result = await apiCall(`/cart/${userId}`);
    return result.data || result.items || [];
  },

  async add(userId, productId, quantity = 1) {
    const result = await apiCall(`/cart/${userId}/add`, {
      method: 'POST',
      body: JSON.stringify({ productId, quantity })
    });
    return result.data || result;
  },

  async update(userId, productId, quantity) {
    const result = await apiCall(`/cart/${userId}/update`, {
      method: 'PATCH',
      body: JSON.stringify({ productId, quantity })
    });
    return result.data || result;
  },

  async remove(userId, productId) {
    const result = await apiCall(`/cart/${userId}/remove/${productId}`, {
      method: 'DELETE'
    });
    return result.data || result;
  },

  async clear(userId) {
    const result = await apiCall(`/cart/${userId}`, {
      method: 'DELETE'
    });
    return result.data || result;
  },

  async count(userId) {
    const result = await apiCall(`/cart/${userId}/count`);
    return result.data || { count: 0 };
  }
};

// Wishlist API
export const wishlistAPI = {
  async get(userId) {
    const result = await apiCall(`/wishlist/${userId}`);
    return result.data || result.items || [];
  },

  async add(userId, productId) {
    const result = await apiCall(`/wishlist/${userId}/add`, {
      method: 'POST',
      body: JSON.stringify({ productId })
    });
    return result.data || result;
  },

  async remove(userId, productId) {
    const result = await apiCall(`/wishlist/${userId}/remove/${productId}`, {
      method: 'DELETE'
    });
    return result.data || result;
  },

  async has(userId, productId) {
    const result = await apiCall(`/wishlist/${userId}/has/${productId}`);
    return result.data || { exists: false };
  },

  async count(userId) {
    const result = await apiCall(`/wishlist/${userId}/count`);
    return result.data || { count: 0 };
  }
};

// Payments API
export const paymentsAPI = {
  async initiateSTK(orderId, userId, phoneNumber, amount) {
    const result = await apiCall('/payments/initiate-stk', {
      method: 'POST',
      body: JSON.stringify({ orderId, userId, phoneNumber, amount })
    });
    return result.data || result;
  },

  async getStatus(orderId) {
    const result = await apiCall(`/payments/status/${orderId}`);
    return result.data || result;
  },

  async getHistory(userId) {
    const result = await apiCall(`/payments/history/${userId}`);
    return result.data || result;
  }
};

// Health check
export async function checkBackendHealth() {
  try {
    const result = await apiCall('/health');
    return result.status === 'ok';
  } catch {
    return false;
  }
}

export default {
  productsAPI,
  uploadsAPI,
  ordersAPI,
  usersAPI,
  cartAPI,
  wishlistAPI,
  paymentsAPI,
  checkBackendHealth,
  apiCall
};
