import { apiClient } from './apiClient';

export interface KnowledgeItem {
  _id: string;
  title: string;
  category: string;
  content: string;
  summary?: string;
  tags: string[];
  importantActs?: string[];
  faqs?: Array<{ question: string; answer: string }>;
  viewCount?: number;
  createdAt: string;
}

export interface KnowledgeAnswer {
  answer: string;
  citations: string[];
  relatedTopics: string[];
  recommendations: {
    relatedActs: string[];
    relatedSections: string[];
    relatedLegalTopics: string[];
    relatedCourtProcedures: string[];
  };
}

export const knowledgeService = {
  async search(query: string, options?: { q?: string; category?: string; limit?: number; skip?: number }): Promise<{ items: KnowledgeItem[]; total: number }> {
    const params = new URLSearchParams();
    const searchQuery = options?.q ?? query ?? '';
    if (searchQuery) params.append('q', searchQuery);
    if (options?.category && options.category !== 'All') params.append('category', options.category);
    if (options?.limit !== undefined) params.append('limit', String(options.limit));
    if (options?.skip !== undefined) params.append('skip', String(options.skip));
    const queryStr = params.toString();
    return apiClient.get(queryStr ? `/knowledge/search?${queryStr}` : '/knowledge/search');
  },

  async askAI(question: string, language: string = 'en'): Promise<KnowledgeAnswer> {
    return apiClient.post('/knowledge/ask', { question, language });
  },

  async getItem(id: string): Promise<{ item: KnowledgeItem }> {
    return apiClient.get(`/knowledge/${id}`);
  },

  async getCategories(): Promise<{ categories: string[] }> {
    return apiClient.get('/knowledge/categories');
  },

  async getActs(): Promise<{ acts: any[] }> {
    return apiClient.get('/knowledge/acts');
  },

  async getActDetails(id: string): Promise<{ act: any }> {
    return apiClient.get(`/knowledge/acts/${id}`);
  }
};
