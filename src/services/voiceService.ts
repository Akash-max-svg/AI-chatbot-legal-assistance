import { apiClient } from './apiClient';

export interface VoiceResponse {
  answer: string;
  structured?: any;
  language: string;
  processingTime?: number;
}

export interface VoiceLog {
  _id: string;
  query: string;
  response?: string;
  language: string;
  wasSpoken: boolean;
  duration?: number;
  success: boolean;
  createdAt: string;
}

export const voiceService = {
  async processQuery(query: string, language: string = 'en-IN'): Promise<VoiceResponse> {
    return apiClient.post('/voice/query', { query, language });
  },

  async getHistory(): Promise<{ logs: VoiceLog[] }> {
    return apiClient.get('/voice/history');
  },

  async detectLanguage(text: string): Promise<{ language: string }> {
    return apiClient.post('/voice/detect-language', { text });
  }
};
