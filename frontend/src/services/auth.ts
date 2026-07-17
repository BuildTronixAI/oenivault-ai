import { apiRequest } from './api';
import type { AuthResponse, User } from '../types';

const ACCESS_KEY = 'oeni_access_token';
const REFRESH_KEY = 'oeni_refresh_token';
const USER_KEY = 'oeni_user';

export function saveSession(data: AuthResponse) {
  localStorage.setItem(ACCESS_KEY, data.accessToken);
  localStorage.setItem(REFRESH_KEY, data.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

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
  const refreshToken = localStorage.getItem(REFRESH_KEY);
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
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.user;
}
