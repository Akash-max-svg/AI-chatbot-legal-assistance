import { chatService } from './chatService';

export interface LegalResearchResult {
  summary: string;
  applicableLaws: string[];
  relevantCaseLaw: string[];
  statutoryProvisions: string[];
  judicialInterpretation: string;
  proceduralAspects: string;
  documentsRequired: string[];
  practicalGuidance: string[];
  recommendations?: any;
  disclaimer: string;
}

export async function runLegalResearch(query: string, language: string = 'en'): Promise<LegalResearchResult> {
  // Use the chat service to perform research
  const response = await chatService.sendMessage(
    `Conduct detailed legal research on: ${query}. Provide applicable laws, similar cases, statutory provisions, judicial interpretations, procedural aspects, documents required, and practical guidance.`,
    language
  );

  // Transform the response into a structured format
  const structured = response.message.structured || {};

  return {
    summary: response.message.text,
    applicableLaws: structured.relevantActs || [],
    relevantCaseLaw: [],
    statutoryProvisions: structured.relevantSections || [],
    judicialInterpretation: '',
    proceduralAspects: structured.filingProcedure?.join('\n') || '',
    documentsRequired: structured.requiredDocuments || [],
    practicalGuidance: structured.suggestedNextSteps || [],
    recommendations: structured.recommendations,
    disclaimer: structured.disclaimer || 'AI-generated legal research for research purposes only. Not legal advice.'
  };
}
