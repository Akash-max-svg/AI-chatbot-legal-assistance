import { apiClient } from './apiClient';

export interface Feedback {
  _id: string;
  type: string;
  subject: string;
  message: string;
  rating?: number;
  category?: string;
  status: string;
  priority: string;
  response?: {
    message: string;
    respondedBy: string;
    respondedAt: string;
  };
  createdAt: string;
}

export const feedbackService = {
  async submitFeedback(data: {
    type: string;
    subject: string;
    message: string;
    rating?: number;
    category?: string;
  }): Promise<{ message: string; feedback: Feedback }> {
    return apiClient.post('/feedback', data);
  },

  async getMyFeedback(): Promise<{ feedbacks: Feedback[] }> {
    return apiClient.get('/feedback/me');
  },

  // Admin functions
  async getFeedback(filters?: { status?: string; type?: string }): Promise<{ feedbacks: Feedback[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/feedback${query}`);
  },

  async updateFeedbackStatus(id: string, status: string, response?: string): Promise<{ feedback: Feedback }> {
    return apiClient.put(`/feedback/${id}`, { status, response });
  }
};
