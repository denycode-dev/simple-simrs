import type { AuthResponse, AuthUser, LoginCredentials } from '../types';

const STORAGE_KEY = 'simrs_auth_user';

/**
 * Simulasi request autentikasi login terstruktur.
 * Bila terhubung ke backend Yii2, gunakan apiClient<AuthResponse>('/auth/login', ...)
 */
export async function loginApi(credentials: LoginCredentials): Promise<AuthResponse> {
  // Simulasi latency jaringan
  await new Promise((resolve) => setTimeout(resolve, 400));

  if (!credentials.username.trim() || !credentials.password.trim()) {
    throw new Error('Username dan kata sandi wajib diisi.');
  }

  // Akun demo untuk verifikasi instan
  if (credentials.username === 'admin' && credentials.password === 'admin123') {
    const user: AuthUser = {
      id: 'USR-001',
      name: 'dr. Hendra Pratama, Sp.PD',
      username: 'admin',
      email: 'hendra.pratama@simplesimrs.org',
      role: 'doctor',
      unit: 'Poli Penyakit Dalam',
    };
    const response: AuthResponse = {
      token: 'jwt-mock-token-simrs-2026',
      user,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return response;
  }

  throw new Error('Kombinasi username atau password salah. Coba: admin / admin123');
}

export async function logoutApi(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  localStorage.removeItem(STORAGE_KEY);
}

export function getStoredUser(): AuthUser | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as AuthUser) : null;
  } catch {
    return null;
  }
}
