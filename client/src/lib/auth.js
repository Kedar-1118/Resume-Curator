import { getMe, logout as logoutAPI } from './api';

/**
 * Check if current user is authenticated.
 * Returns user data or null.
 */
export async function checkAuth() {
  try {
    const user = await getMe();
    return user;
  } catch {
    return null;
  }
}

/**
 * Redirect to Google OAuth login.
 */
export function loginWithGoogle() {
  window.location.href = 'http://localhost:5000/api/auth/google';
}

/**
 * Logout and clear session.
 */
export async function logout() {
  try {
    await logoutAPI();
  } catch {
    // Cookie may already be cleared
  }
  window.location.href = '/';
}
