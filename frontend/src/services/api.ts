import { clearSession, getAccessToken, getRefreshToken, saveSession } from './session';
import type { AuthResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

let refreshPromise: Promise<AuthResponse> | null = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token');
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new ApiError(data.error || 'Refresh failed', res.status, data.code);
      }
      const auth = data as AuthResponse;
      saveSession(auth);
      return auth;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
  retry = true
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (auth) {
    const token = getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401 && auth && retry) {
    try {
      await refreshAccessToken();
      return apiRequest<T>(path, options, auth, false);
    } catch {
      clearSession();
      throw new ApiError('Session expired', 401, 'SESSION_EXPIRED');
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(data.error || 'Request failed', res.status, data.code);
  }

  return data as T;
}

export async function downloadBlob(path: string, filename: string, retried = false) {
  const headers = new Headers();
  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { headers });
  if (res.status === 401 && !retried) {
    try {
      await refreshAccessToken();
      return downloadBlob(path, filename, true);
    } catch {
      clearSession();
      throw new ApiError('Session expired', 401, 'SESSION_EXPIRED');
    }
  }
  if (!res.ok) throw new ApiError('Download failed', res.status);

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
