import { apiRequest } from './api';
import {
  clearSession,
  getRefreshToken,
  saveSession,
  setStoredUser,
} from './session';
import type { AuthResponse, User } from '../types';

export {
  clearSession,
  getAccessToken,
  getStoredUser,
  saveSession,
} from './session';

export async function login(email: string, password: string) {
  const data = await apiRequest<AuthResponse>(
    '/api/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
    false
  );
  saveSession(data);
  return data;
}

export async function signup(fullName: string, email: string, password: string) {
  const data = await apiRequest<AuthResponse>(
    '/api/auth/signup',
    { method: 'POST', body: JSON.stringify({ fullName, email, password }) },
    false
  );
  saveSession(data);
  return data;
}

export async function logout() {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST' });
  } catch {
    // ignore network errors on logout
  }
  clearSession();
}

export async function refreshSession() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');
  const data = await apiRequest<AuthResponse>(
    '/api/auth/refresh',
    { method: 'POST', body: JSON.stringify({ refreshToken }) },
    false
  );
  saveSession(data);
  return data;
}

export async function fetchMe() {
  const data = await apiRequest<{ user: User }>('/api/auth/me');
  setStoredUser(data.user);
  return data.user;
}
