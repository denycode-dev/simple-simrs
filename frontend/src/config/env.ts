/**
 * Centralized application environment configurations.
 */
export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  APP_NAME: 'SIMRS Inova Medika',
  APP_VERSION: '1.0.0',
  IS_DEV: import.meta.env.DEV,
} as const;
