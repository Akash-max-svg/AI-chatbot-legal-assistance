import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(baseUrl: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.loadToken();
    this.setupInterceptors();
  }

  private loadToken() {
    this.token = localStorage.getItem('accessToken');
    if (this.token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('accessToken', token);
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      delete this.client.defaults.headers.common['Authorization'];
    }
  }

  getToken() {
    return this.token;
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return null;

      try {
        const response = await axios.post(`${this.client.defaults.baseURL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        this.setToken(accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        return accessToken;
      } catch {
        return null;
      } finally {
        this.isRefreshing = false;
      }
    })();

    return this.refreshPromise;
  }

  private setupInterceptors() {
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Only attempt refresh on 401 and if we haven't already retried
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;

          // Don't attempt refresh on auth endpoints themselves
          const url = originalRequest.url || '';
          if (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh-token') || url.includes('/auth/forgot-password') || url.includes('/auth/reset-password')) {
            throw error;
          }

          const newToken = await this.refreshAccessToken();
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client.request(originalRequest);
          }

          // Refresh failed - clear tokens silently, don't throw "Session expired"
          this.setToken(null);
          throw error;
        }

        throw error;
      }
    );
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await this.client.get<T>(endpoint);
    return response.data;
  }

  async post<T>(endpoint: string, body?: any): Promise<T> {
    const response = await this.client.post<T>(endpoint, body);
    return response.data;
  }

  async put<T>(endpoint: string, body?: any): Promise<T> {
    const response = await this.client.put<T>(endpoint, body);
    return response.data;
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await this.client.delete<T>(endpoint);
    return response.data;
  }

  async upload<T>(endpoint: string, file: File, additionalData?: Record<string, string>): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await this.client.post<T>(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
