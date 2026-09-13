import { apiClient } from './apiClient';

export interface Judgement {
  _id: string;
  title: string;
  citationNumber?: string;
  court: string;
  date: string;
  caseNumber?: string;
  category?: string;
  summary?: string;
  parties?: {
    petitioner: string;
    respondent: string;
  };
}

export interface GovernmentAct {
  _id: string;
  name: string;
  shortTitle?: string;
  year?: number;
  ministry?: string;
  category?: string;
  description?: string;
  sections?: Array<{
    number: string;
    title: string;
    content: string;
  }>;
  effectiveDate?: string;
  isActive: boolean;
  officialUrl?: string;
}

export const governmentService = {
  async getLatestJudgements(limit = 10): Promise<{ judgements: Judgement[] }> {
    return apiClient.get(`/government/judgements/latest?limit=${limit}`);
  },

  async searchJudgements(filters?: { q?: string; court?: string; year?: string }): Promise<{ judgements: Judgement[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.q) params.append('q', filters.q);
    if (filters?.court) params.append('court', filters.court);
    if (filters?.year) params.append('year', filters.year);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/government/judgements/search${query}`);
  },

  async getActs(category?: string): Promise<{ acts: GovernmentAct[]; total: number }> {
    const query = category ? `?category=${category}` : '';
    return apiClient.get(`/government/acts${query}`);
  },

  async getAct(id: string): Promise<{ act: GovernmentAct }> {
    return apiClient.get(`/government/acts/${id}`);
  },

  async getNotices(): Promise<{ notices: any[] }> {
    return apiClient.get('/government/notices');
  },

  async getFAQs(): Promise<{ faqs: any[] }> {
    return apiClient.get('/government/faqs');
  }
};
