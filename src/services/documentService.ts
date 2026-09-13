import { apiClient } from './apiClient';

export interface Document {
  _id: string;
  title: string;
  type: string;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  status: string;
  aiGenerated: boolean;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export const documentService = {
  async getDocuments(filters?: { type?: string; status?: string }): Promise<{ documents: Document[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/documents${query}`);
  },

  async getDocument(id: string): Promise<{ document: Document }> {
    return apiClient.get(`/documents/${id}`);
  },

  async createDocument(data: Partial<Document>): Promise<{ document: Document }> {
    return apiClient.post('/documents', data);
  },

  async updateDocument(id: string, data: Partial<Document>): Promise<{ document: Document }> {
    return apiClient.put(`/documents/${id}`, data);
  },

  async deleteDocument(id: string): Promise<void> {
    return apiClient.delete(`/documents/${id}`);
  },

  async generateDocument(documentType: string, details: any): Promise<{ document: Document }> {
    return apiClient.post('/documents/generate', { documentType, details });
  }
};
