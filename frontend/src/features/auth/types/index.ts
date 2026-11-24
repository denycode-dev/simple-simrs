export type UserRole =
  | 'admin'
  | 'registration'
  | 'nurse'
  | 'doctor'
  | 'pharmacist'
  | 'lab'
  | 'cashier';

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  email?: string;
  role: UserRole;
  unit?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
