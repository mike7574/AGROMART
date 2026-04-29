/**
 * AgroMart Account Service
 * Handles user authentication and account operations with backend
 */

import { usersAPI } from './api.js';

// Constants
const KEY_SESSION = 'agromart_session_v1';
const KEY_AUTH_TOKEN = 'agromart_auth_token';
const KEY_USER_ID = 'agromart_user_id';

/**
 * Register a new user
 */
export async function register(email, fullName, password) {
  console.log('📝 Registering new user:', email);
  
  if (!email || !fullName || !password) {
    throw new Error('Email, full name, and password are required');
  }

  try {
    const result = await usersAPI.register({ email, fullName, password });
    console.log('✅ Registration successful');
    
    // Store session
    const session = {
      id: result.id,
      email: result.email,
      fullName: result.fullName,
      isDemo: false
    };
    setSession(session);
    
    return result;
  } catch (error) {
    console.error('❌ Registration failed:', error.message);
    throw error;
  }
}

/**
 * Login user
 */
export async function login(email, password, fullName = null) {
  console.log('🔑 Logging in user:', email);
  
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  try {
    const result = await usersAPI.login(email, password);
    console.log('✅ Login successful');
    
    // Store session and token
    const session = {
      id: result.id,
      email: result.email,
      fullName: result.fullName || fullName || 'User',
      isDemo: false,
      token: result.token
    };
    setSession(session);
    localStorage.setItem(KEY_AUTH_TOKEN, result.token);
    localStorage.setItem(KEY_USER_ID, result.id);
    
    return result;
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    throw error;
  }
}

/**
 * Get current session
 */
export function getSession() {
  try {
    const raw = localStorage.getItem(KEY_SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Set current session
 */
export function setSession(session) {
  if (session) {
    localStorage.setItem(KEY_SESSION, JSON.stringify(session));
    console.log('🔐 Session saved for:', session.email);
  } else {
    localStorage.removeItem(KEY_SESSION);
    localStorage.removeItem(KEY_AUTH_TOKEN);
    localStorage.removeItem(KEY_USER_ID);
    console.log('🚪 Session cleared (logged out)');
  }
}

/**
 * Get auth token
 */
export function getAuthToken() {
  return localStorage.getItem(KEY_AUTH_TOKEN);
}

/**
 * Check if user is logged in
 */
export function isLoggedIn() {
  const session = getSession();
  return !!session;
}

/**
 * Logout
 */
export function logout() {
  usersAPI.logout();
  setSession(null);
  console.log('👋 User logged out');
}

export default {
  register,
  login,
  logout,
  getSession,
  setSession,
  isLoggedIn,
  getAuthToken
};
