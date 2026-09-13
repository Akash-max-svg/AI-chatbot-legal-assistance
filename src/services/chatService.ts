import type { LawSection } from './ipcService';
import { apiClient } from './apiClient';

export interface StructuredResponse {
  relevantActs?: string[];
  ipcSections?: LawSection[];
  relevantSections?: string[];
  legalRights?: string[];
  filingProcedure?: string[];
  requiredDocuments?: string[];
  courtToApproach?: string;
  governmentDepartment?: string;
  estimatedTimeline?: string;
  suggestedNextSteps?: string[];
  mediationPossibility?: string;
  recommendations?: {
    relatedActs: string[];
    relatedSections: string[];
    relatedLegalTopics: string[];
    relatedCourtProcedures: string[];
  };
  disclaimer?: string;
}

export interface ChatResponse {
  sessionId: string;
  message: {
    id: string;
    role: 'user' | 'ai';
    text: string;
    structured?: StructuredResponse;
    time: string;
  };
}

export interface ChatSession {
  _id: string;
  title: string;
  language: string;
  lastMessageAt: string;
  createdAt: string;
}

export interface ChatMessage {
  _id: string;
  role: 'user' | 'ai';
  text: string;
  structured?: StructuredResponse;
  createdAt: string;
}

export const chatService = {
  async sendMessage(message: string, language: string = 'en', sessionId?: string): Promise<ChatResponse> {
    return apiClient.post<ChatResponse>('/chat/send', { message, language, sessionId });
  },

  async getSessions(): Promise<{ sessions: ChatSession[] }> {
    return apiClient.get('/chat/sessions');
  },

  async getSessionMessages(sessionId: string): Promise<{ messages: ChatMessage[] }> {
    return apiClient.get(`/chat/sessions/${sessionId}/messages`);
  },

  async deleteSession(sessionId: string): Promise<void> {
    return apiClient.delete(`/chat/sessions/${sessionId}`);
  },

  async rateMessage(messageId: string, rating: number, comment?: string): Promise<void> {
    return apiClient.post(`/chat/messages/${messageId}/rate`, { rating, comment });
  }
};

export const sampleQuestions = [
  'What are consumer rights for defective products?',
  'Explain Section 498A of the Indian Penal Code',
  'What are the grounds for divorce under the Hindu Marriage Act?',
  'How to file an RTI application for court records?',
  'What is the procedure for filing a writ petition in the Supreme Court?',
  'Explain Article 21 of the Indian Constitution',
  'What are cyber crime laws in India?',
  'How to file a case in Consumer Court?',
];
