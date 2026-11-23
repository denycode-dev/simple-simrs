import { useState, useCallback } from 'react';
import type { AuthState, LoginCredentials } from '../types';
import { loginApi, logoutApi, getStoredUser } from '../api/auth-api';

export function useAuth() {
  const [state, setState] = useState<AuthState>(() => {
    const initialUser = getStoredUser();
    return {
      user: initialUser,
      isAuthenticated: Boolean(initialUser),
      isLoading: false,
      error: null,
    };
  });

  const login = useCallback(async (credentials: LoginCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await loginApi(credentials);
      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat masuk.';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await logoutApi();
    } finally {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  return {
    ...state,
    login,
    logout,
  };
}
