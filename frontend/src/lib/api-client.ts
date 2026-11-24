import { ENV } from '@/config/env';

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiClientError extends Error {
  statusCode: number;
  errors?: Record<string, string[]>;

  constructor(message: string, statusCode: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

/**
 * Standard typed HTTP client wrapper around native fetch (zero-dependency).
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers, ...customConfig } = options;

  let url = endpoint.startsWith('http')
    ? endpoint
    : `${ENV.API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    const query = searchParams.toString();
    if (query) {
      url += `${url.includes('?') ? '&' : '?'}${query}`;
    }
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('simrs_token') : null;

  const config: RequestInit = {
    method: customConfig.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...customConfig,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorMessage = `Permintaan gagal: HTTP ${response.status}`;
    let errorDetails: Record<string, string[]> | undefined;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.message || errorMessage;
      errorDetails = errorBody.errors;
    } catch {
      // Body bukan JSON
    }
    throw new ApiClientError(errorMessage, response.status, errorDetails);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}
