import { apiClient } from './apiClient';

export type UserRole = 'Citizen' | 'Lawyer' | 'Judge' | 'Admin';

export interface User {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  address?: string;
  avatar?: string;
  isVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  preferences?: {
    language?: string;
    notifications?: boolean;
    voiceAssistant?: boolean;
  };
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
}

export const authService = {
  async register(data: RegisterData): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/register', data);
    apiClient.setToken(response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    return response;
  },

  async login(email: string, password: string, rememberMe?: boolean): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', { email, password, rememberMe });
    apiClient.setToken(response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    return response;
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await apiClient.post('/auth/logout', { refreshToken });
    } catch {
      // Ignore logout errors
    } finally {
      apiClient.setToken(null);
    }
  },

  async getMe(): Promise<{ user: User }> {
    return apiClient.get('/auth/me');
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/reset-password', { token, password });
    apiClient.setToken(response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    return response;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/change-password', { currentPassword, newPassword });
    apiClient.setToken(response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    return response;
  },

  async updateProfile(data: { name?: string; phone?: string; address?: string; preferences?: any }): Promise<{ user: User }> {
    return apiClient.put('/users/me', data);
  },

  isLoggedIn(): boolean {
    return !!apiClient.getToken();
  }
};
