/**
 * Centralized application environment configurations.
 */
export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  ANCILLARY_BASE_URL: import.meta.env.VITE_ANCILLARY_BASE_URL || 'http://localhost:4000/api/v1',
  APP_NAME: 'Simple SIMRS',
  APP_VERSION: '1.0.0',
  IS_DEV: import.meta.env.DEV,
} as const;
