import { apiClient } from './apiClient';
import { authService, type User } from './authService';

export const userService = {
  async getProfile(): Promise<{ user: User }> {
    return authService.getMe();
  },

  async updateProfile(data: { name?: string; phone?: string; address?: string; preferences?: any }): Promise<{ user: User }> {
    return authService.updateProfile(data);
  },

  async deleteProfile(): Promise<void> {
    return apiClient.delete('/users/me');
  },

  async getStats(userId?: string): Promise<{ stats: any }> {
    const endpoint = userId ? `/users/${userId}/stats` : '/users/me/stats';
    return apiClient.get(endpoint);
  },

  // Admin functions
  async getUsers(filters?: { role?: string; search?: string }): Promise<{ users: User[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.search) params.append('search', filters.search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/users${query}`);
  },

  async getUser(id: string): Promise<{ user: User }> {
    return apiClient.get(`/users/${id}`);
  },

  async updateUserRole(id: string, role: string): Promise<{ user: User }> {
    return apiClient.put(`/users/${id}/role`, { role });
  },

  async deactivateUser(id: string): Promise<void> {
    return apiClient.delete(`/users/${id}`);
  }
};
