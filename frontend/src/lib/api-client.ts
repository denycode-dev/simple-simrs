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

type ErrorHandler = (error: ApiClientError) => void;
const errorHandlers: Set<ErrorHandler> = new Set();

export function registerGlobalErrorHandler(handler: ErrorHandler): () => void {
  errorHandlers.add(handler);
  return () => {
    errorHandlers.delete(handler);
  };
}

function notifyGlobalErrorHandlers(error: ApiClientError) {
  errorHandlers.forEach((handler) => {
    try {
      handler(error);
    } catch {
      // Ignore handler error
    }
  });
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

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (fetchErr: any) {
    const netError = new ApiClientError(fetchErr.message || 'Koneksi jaringan terputus.', 0);
    notifyGlobalErrorHandlers(netError);
    throw netError;
  }

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

    const apiError = new ApiClientError(errorMessage, response.status, errorDetails);
    // Suppress global modal for 422 inline form errors
    if (response.status !== 422) {
      notifyGlobalErrorHandlers(apiError);
    }
    throw apiError;
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}
