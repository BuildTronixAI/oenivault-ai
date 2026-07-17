import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import type { User } from '../types';
import * as authService from '../services/auth';

let userState: User | null = authService.getStoredUser();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function setUserState(user: User | null) {
  userState = user;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return userState;
}

export function useAuth() {
  const user = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      if (!authService.getAccessToken()) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const me = await authService.fetchMe();
        if (!cancelled) setUserState(me);
      } catch {
        authService.clearSession();
        if (!cancelled) setUserState(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const data = await authService.login(email, password);
      setUserState(data.user);
      return data.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    }
  }, []);

  const signup = useCallback(async (fullName: string, email: string, password: string) => {
    setError(null);
    try {
      const data = await authService.signup(fullName, email, password);
      setUserState(data.user);
      return data.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUserState(null);
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    signup,
    logout,
  };
}
