import { apiClient } from './apiClient';

export interface CaseFilingResult {
  documentId: string;
  caseCategory: string;
  applicableLaws: string[];
  applicableActs: string[];
  applicableSections: string[];
  legalRights: string[];
  requiredDocuments: string[];
  evidenceRequired: string[];
  courtToApproach: string;
  governmentDepartment: string;
  courtFees: string;
  expectedTimeline: string;
  filingProcedure: string[];
  alternativeRemedies: string[];
  mediationSuggestions: string;
  draftComplaint: string;
  draftLegalNotice: string;
  checklistBeforeFiling: string[];
  recommendations: {
    relatedActs: string[];
    relatedSections: string[];
    relatedLegalTopics: string[];
    relatedCourtProcedures: string[];
  };
  disclaimer: string;
}

export interface Case {
  _id: string;
  caseNumber?: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  courtName?: string;
  courtType?: string;
  filingDate?: string;
  nextHearingDate?: string;
  hearingDates: Array<{
    date: string;
    status: string;
    notes?: string;
  }>;
  notes: Array<{
    content: string;
    createdBy: string;
    createdAt: string;
  }>;
  filedBy: any;
  assignedLawyer?: any;
  assignedJudge?: any;
  createdAt: string;
  updatedAt: string;
}

export const caseFilingService = {
  async analyzeCase(scenario: string, category: string, language: string = 'en'): Promise<CaseFilingResult> {
    return apiClient.post<CaseFilingResult>('/case-filing/analyze', { scenario, category, language });
  },

  async getCases(filters?: { status?: string; category?: string }): Promise<{ cases: Case[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/cases${query}`);
  },

  async getCase(id: string): Promise<{ case: Case }> {
    return apiClient.get(`/cases/${id}`);
  },

  async createCase(data: Partial<Case>): Promise<{ case: Case }> {
    return apiClient.post('/case-filing', data);
  },

  async updateCase(id: string, data: Partial<Case>): Promise<{ case: Case }> {
    return apiClient.put(`/cases/${id}`, data);
  },

  async deleteCase(id: string): Promise<void> {
    return apiClient.delete(`/cases/${id}`);
  }
};
