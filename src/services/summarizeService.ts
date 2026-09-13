import { apiClient } from './apiClient';
import { generateLegalPDF } from '../utils/pdfExport';

export interface SummarySection {
  heading: string;
  content: string;
}

export interface SummaryResult {
  summary: {
    id: string;
    caseTitle: string;
    court: string;
    date: string;
    sections: SummarySection[];
    recommendations?: any;
  };
  processingTime?: number;
}

export const summarizeService = {
  async summarizeDocument(content: string): Promise<SummaryResult> {
    return apiClient.post('/summarizer', { content });
  },

  async uploadAndSummarize(file: File): Promise<SummaryResult> {
    return apiClient.upload('/summarizer', file);
  },

  async getSummaries(): Promise<{ summaries: any[] }> {
    return apiClient.get('/summarizer');
  },

  async getSummary(id: string): Promise<{ summary: any }> {
    return apiClient.get(`/summarizer/${id}`);
  },

  async deleteSummary(id: string): Promise<void> {
    return apiClient.delete(`/summarizer/${id}`);
  }
};

export function exportSummaryAsPDF(
  sections: SummarySection[],
  caseTitle: string,
  court: string,
  date: string
): void {
  generateLegalPDF({
    title: 'Judgment Summary',
    subtitle: caseTitle || 'Legal Document Summary',
    meta: [
      { label: 'Case', value: caseTitle || 'N/A' },
      { label: 'Court', value: court || 'N/A' },
      { label: 'Date', value: date || 'N/A' }
    ],
    sections: sections.map((s) => ({ heading: s.heading, body: s.content })),
    footer: 'This is an AI-generated summary for legal research purposes only. It does not constitute legal advice. Always refer to the full text of the judgment for official use.'
  });
}
