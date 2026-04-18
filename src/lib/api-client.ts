// Frontend API Client Configuration
// In the browser, always route through local Next.js API proxy endpoints.
// This avoids production path mismatches between /auth/* and /api/auth/* on backend services.
const API_BASE_URL =
  typeof window !== 'undefined'
    ? '/api'
    : process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_API_URL || '/api';

export interface ApiError {
  error: string;
  details?: any;
  statusCode?: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.loadToken();
  }

  private loadToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  removeToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
    body?: any
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const options: RequestInit = {
      method,
      headers: this.getHeaders(),
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorData = await response.json();
        const error: ApiError = {
          error: errorData.error || 'An error occurred',
          details: errorData.details,
          statusCode: response.status,
        };

        if (response.status === 401) {
          this.removeToken();
          // Redirect to login
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }

        throw error;
      }

      return await response.json();
    } catch (error) {
      if (error && typeof error === 'object' && 'error' in error) {
        throw error;
      }
      throw {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, 'GET');
  }

  post<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, 'POST', body);
  }

  patch<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, 'PATCH', body);
  }

  put<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>(endpoint, 'PUT', body);
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, 'DELETE');
  }
}

export const apiClient = new ApiClient();