import { apiClient } from './apiClient';

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  relatedCase?: any;
  relatedDocument?: any;
  isRead: boolean;
  readAt?: string;
  priority: string;
  actionUrl?: string;
  createdAt: string;
}

export const notificationService = {
  async getNotifications(unreadOnly = false): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const query = unreadOnly ? '?unreadOnly=true' : '';
    return apiClient.get(`/notifications${query}`);
  },

  async markAsRead(id: string): Promise<{ notification: Notification }> {
    return apiClient.put(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<{ message: string }> {
    return apiClient.put('/notifications/read-all');
  },

  async deleteNotification(id: string): Promise<void> {
    return apiClient.delete(`/notifications/${id}`);
  }
};
