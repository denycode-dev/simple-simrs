import { apiClient } from '@/lib/api-client';
import type { AuthResponse, AuthUser, LoginCredentials, UserRole } from '../types';

const USER_STORAGE_KEY = 'simrs_auth_user';
const TOKEN_STORAGE_KEY = 'simrs_token';

interface BackendLoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    tokenType: string;
    user: {
      id: number;
      username: string;
      fullName?: string;
      role: UserRole;
    };
  };
}

export async function loginApi(credentials: LoginCredentials): Promise<AuthResponse> {
  if (!credentials.username.trim() || !credentials.password.trim()) {
    throw new Error('Username dan kata sandi wajib diisi.');
  }

  const res = await apiClient<BackendLoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  const backendUser = res.data.user;
  const unitMap: Record<UserRole, string> = {
    admin: 'Administrator Sistem',
    registration: 'Loket Pendaftaran Rawat Jalan',
    nurse: 'Keperawatan & Triage',
    doctor: 'Poliklinik Rawat Jalan',
    pharmacist: 'Instalasi Farmasi',
    lab: 'Laboratorium Klinis',
    cashier: 'Kasir & Pembayaran',
  };

  const user: AuthUser = {
    id: String(backendUser.id),
    name: backendUser.fullName || backendUser.username,
    username: backendUser.username,
    role: backendUser.role,
    unit: unitMap[backendUser.role] || 'SIMRS Unit',
  };

  localStorage.setItem(TOKEN_STORAGE_KEY, res.data.token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

  return {
    token: res.data.token,
    user,
  };
}

export async function logoutApi(): Promise<void> {
  try {
    await apiClient('/auth/logout', { method: 'POST' });
  } catch {
    // Ignore error on logout
  } finally {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export function getStoredUser(): AuthUser | null {
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}
