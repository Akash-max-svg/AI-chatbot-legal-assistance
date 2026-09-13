/**
 * legalAIService.js  — Advanced NLP/DL Pipeline
 * ─────────────────────────────────────────────────────────────────────────────
 * Query processing pipeline:
 *  1. Intent Classification  (TF-IDF cosine similarity)
 *  2. Named Entity Recognition  (regex + legal thesaurus)
 *  3. Query Expansion  (synonym thesaurus + section neighbours)
 *  4. Hybrid Retrieval  (BM25 + TF-IDF semantic + NER + RRF fusion)
 *  5. Gemini Cross-encoder Re-ranking  (LLM-as-judge)
 *  6. Enriched Prompt Construction
 *  7. Gemini Structured Response Generation
 *  8. Response Formatting & Validation
 */

'use strict';

const ai           = require('./aiService');
const legalService = require('./legalService');
const { generateContent, generateStructuredResponse } = ai;

// ── NLP pipeline modules ──────────────────────────────────────────────────────
const { classifyIntent, getIntentActs }         = require('./nlp/intentClassifier');
const { expandQuery }                            = require('./nlp/queryExpander');
const { extractEntities, extractSectionNumbers } = require('./nlp/legalNER');
const { hybridRetrieve, computeRetrievalConfidence } = require('./nlp/hybridRetrieval');
const {
  formatEnhancedResponse,
  validateAnswer,
  buildFallbackAnswer: buildNLPFallback,
} = require('./nlp/responseFormatter');

// ── Gemini model reference for re-ranking ─────────────────────────────────────
// We pass the raw generative model instance so hybridRetrieval can call it
let _geminiModelInstance = null;
function getGeminiModel() {
  if (_geminiModelInstance) return _geminiModelInstance;
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    _geminiModelInstance = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
  } catch { _geminiModelInstance = null; }
  return _geminiModelInstance;
}

// ── Format a law entry into a compact prompt snippet ─────────────────────────
function formatEntryForPrompt(e) {
  const desc = e.section_desc
    ? e.section_desc.substring(0, 300) + (e.section_desc.length > 300 ? '...' : '')
    : '';
  return `[${e.act_short} §${e.section}] ${e.section_title}: ${desc}`;
}

// ── Fallback answer builder ────────────────────────────────────────────────────
function buildFallbackAnswer(message, topLaws, intentResult) {
  const sections = topLaws.slice(0, 4).map(
    l => `${l.act_short} §${l.section} (${l.section_title})`
  ).join('; ');
  const intentHint = intentResult
    ? ` This relates to **${intentResult.primaryLabel}**.`
    : '';
  return (
    `I understand your legal query: *"${message}"*.${intentHint}\n\n` +
    (sections
      ? `Based on advanced NLP retrieval, the most relevant provisions are:\n${
          topLaws.slice(0, 4).map(l =>
            `- **${l.act_short} §${l.section}** — ${l.section_title}`
          ).join('\n')
        }\n\n`
      : '') +
    `For a precise legal answer, please consult a qualified advocate. You may also approach your nearest **District Legal Services Authority (DLSA)** for free legal aid.`
  );
}

// ── Main chat query processor ─────────────────────────────────────────────────
async function processChatQuery(message, language = 'en', conversationHistory = []) {

  // ══════════════════════════════════════════════════════════
  //  STAGE 1: NLP Analysis (all in-process, no API call)
  // ══════════════════════════════════════════════════════════

  // 1a. Intent classification — TF-IDF cosine similarity
  const intentResult = classifyIntent(message);

  // 1b. Named Entity Recognition — regex + legal thesaurus
  const nerResult = extractEntities(message);

  // 1c. Query expansion — synonyms + section neighbours + act injection
  const { expandedQuery, addedTerms, sectionHints } = expandQuery(message, intentResult);

  // ══════════════════════════════════════════════════════════
  //  STAGE 2: Hybrid Retrieval (BM25 + Semantic + NER + RRF)
  // ══════════════════════════════════════════════════════════
  const geminiModel = getGeminiModel();

  let retrievedResults = [];
  try {
    retrievedResults = await hybridRetrieve(
      message,
      expandedQuery,
      intentResult,
      nerResult,
      geminiModel,  // enables Gemini re-ranking
      12            // return top-12 sections
    );
  } catch (err) {
    // Fallback to simple keyword search if hybrid fails
    console.warn('[legalAIService] Hybrid retrieval failed, using fallback:', err.message);
    const fallbackHits = legalService.searchLaws(expandedQuery, { limit: 10 });
    retrievedResults = fallbackHits.map((e, i) => ({
      entry: e, rrfScore: 0.1, geminiScore: null,
      finalScore: 100 - i * 5, signals: {},
    }));
  }

  const topLaws = retrievedResults.map(r => r.entry).filter(Boolean);

  // Compute retrieval confidence
  const retrievalConfidence = computeRetrievalConfidence(retrievedResults, nerResult);

  // ══════════════════════════════════════════════════════════
  //  STAGE 3: Build enriched prompt for Gemini
  // ══════════════════════════════════════════════════════════
  const historyContext = conversationHistory.length > 0
    ? `\n\nConversation history:\n${
        conversationHistory
          .slice(-5)
          .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
          .join('\n')
      }`
    : '';

  // Build law context — include signal annotations for better Gemini reasoning
  const lawContextLines = retrievedResults.slice(0, 10).map((r, i) => {
    const e = r.entry;
    const signalNote = r.geminiScore != null
      ? ` [Relevance: ${r.geminiScore}/10]`
      : r.rrfScore > 0.05 ? ' [High relevance]' : '';
    return `${i + 1}. ${formatEntryForPrompt(e)}${signalNote}`;
  });

  const lawContext = topLaws.length > 0
    ? `\n\n## Relevant Indian Laws (retrieved via hybrid NLP search)\n${lawContextLines.join('\n')}`
    : '';

  // NER context — explicit section refs the user mentioned
  const nerContext = nerResult.sections.length > 0
    ? `\n\nUser explicitly referenced: ${nerResult.sections.join(', ')}`
    : '';

  // Intent context
  const intentContext = `\n\nDetected legal domain: ${intentResult.primaryLabel}${
    intentResult.secondary.length > 0
      ? ` (also: ${intentResult.secondaryLabels.join(', ')})`
      : ''
  } [Confidence: ${intentResult.confidence}%]`;

  const prompt = `You are an expert AI Legal Assistant for Indian law, powered by an advanced NLP retrieval pipeline.
${historyContext}${intentContext}${nerContext}${lawContext}

## User Query
"${message}"

## Instructions
Provide a comprehensive, accurate legal response. 
- Cite EXACT section numbers: e.g. "Section 302 IPC", "Section 138 NIA", "Article 21 Constitution"
- Structure the response clearly with headings where needed
- Include step-by-step procedure if the user needs to take action
- Mention time limits, court fees, and documentation requirements where applicable
- If multiple laws apply, explain how they interact
- For criminal matters: mention cognizability, bailable status, and trial court
- Language: respond in the same language as the user's query

Respond with a JSON object:
{
  "answer": "Comprehensive markdown-formatted explanation (minimum 200 words for legal questions)",
  "structured": {
    "relevantActs": ["Full act names e.g. 'Indian Penal Code, 1860'"],
    "relevantSections": ["Sections with act names e.g. 'Section 302 IPC', 'Article 21 Constitution of India'"],
    "legalRights": ["Specific applicable legal rights of the user"],
    "filingProcedure": ["Numbered step-by-step procedure for filing/complaint"],
    "requiredDocuments": ["Specific documents needed"],
    "courtToApproach": "Exact court or authority with jurisdiction",
    "governmentDepartment": "Relevant government department or helpline",
    "estimatedTimeline": "Realistic timeline for resolution",
    "suggestedNextSteps": ["Immediate actionable steps the user should take"],
    "mediationPossibility": "Whether ADR/mediation/Lok Adalat is suitable",
    "recommendations": {
      "relatedActs": ["Related acts to explore"],
      "relatedSections": ["Other relevant section references"],
      "relatedLegalTopics": ["Related legal concepts"],
      "relatedCourtProcedures": ["Related procedural steps"]
    },
    "disclaimer": "AI-generated legal information for research purposes only. Not a substitute for professional legal advice. Consult a qualified advocate."
  }
}`;

  // ══════════════════════════════════════════════════════════
  //  STAGE 4: Gemini response generation
  // ══════════════════════════════════════════════════════════
  let aiResponse = null;
  try {
    aiResponse = await generateStructuredResponse(prompt, language);
  } catch (err) {
    console.warn('[legalAIService] generateStructuredResponse failed:', err.message);
    // Try plain text fallback
    try {
      const plainText = await generateContent(prompt, language);
      aiResponse = { answer: plainText, structured: {} };
    } catch {
      aiResponse = null;
    }
  }

  // ══════════════════════════════════════════════════════════
  //  STAGE 5: Validate & normalise response
  // ══════════════════════════════════════════════════════════
  if (!aiResponse || !validateAnswer(aiResponse.answer || '', topLaws, message)) {
    aiResponse = {
      answer: buildFallbackAnswer(message, topLaws, intentResult),
      structured: {},
    };
  }

  if (!aiResponse.structured) aiResponse.structured = {};

  // ══════════════════════════════════════════════════════════
  //  STAGE 6: Resolve AI-cited sections + inject NLP metadata
  // ══════════════════════════════════════════════════════════
  const aiSectionStrings = [
    ...(aiResponse.structured.relevantSections || []),
    ...(aiResponse.structured.recommendations?.relatedSections || []),
  ];
  const aiResolvedLaws = legalService.resolveFromAIList(aiSectionStrings, 2);

  // Final deduped law sections
  const finalMap = new Map();
  [...topLaws, ...aiResolvedLaws].forEach(e => {
    const k = e.id || `${e.act_short}-${e.section}`;
    finalMap.set(k, e);
  });
  const lawSections = [...finalMap.values()].slice(0, 12);

  // Build enhanced structured content (additional formatted section)
  const enhancedContent = formatEnhancedResponse(aiResponse.structured, {
    intent: intentResult,
    confidence: retrievalConfidence,
    nerResult,
    retrievedSections: lawSections,
  });

  // Inject all NLP metadata into the structured response
  aiResponse.structured.ipcSections         = lawSections;          // backward compat
  aiResponse.structured.lawSections         = lawSections;          // unified
  aiResponse.structured.nlpMeta = {
    intent:               intentResult.primaryLabel,
    intentIcon:           intentResult.primaryIcon,
    intentConfidence:     intentResult.confidence,
    retrievalConfidence,
    detectedSections:     nerResult.sections,
    detectedActs:         nerResult.acts,
    expandedTerms:        addedTerms.slice(0, 6),
    sectionHints:         sectionHints.slice(0, 4),
    signals:              retrievedResults.slice(0, 5).map(r => ({
      section:    `${r.entry?.act_short} §${r.entry?.section}`,
      rrfScore:   r.rrfScore,
      geminiScore: r.geminiScore,
    })),
  };

  // Append enhanced formatting to the answer
  if (enhancedContent && enhancedContent.length > 50) {
    aiResponse.answer = aiResponse.answer + '\n\n---\n\n' + enhancedContent;
  }

  return aiResponse;
}

// ── Other AI service functions (unchanged from original) ──────────────────────
async function summarizeJudgment(documentContent, language = 'en') {
  const prompt = `You are a legal expert specializing in Indian court judgments. Summarize the following judgment document.

Document Content:
"""
${documentContent.substring(0, 50000)}
"""

Respond with a JSON object:
{
  "caseTitle": "Full case title with citation",
  "court": "Court name",
  "date": "Judgment date",
  "facts": "Summary of facts",
  "issues": "Legal issues framed",
  "arguments": "Key arguments",
  "evidence": "Important evidence",
  "reasoning": "Court's reasoning",
  "applicableLaws": ["Acts/sections applied"],
  "courtDecision": "The decision/order",
  "judgmentOutcome": "Final outcome",
  "importantCitations": ["Key case citations"],
  "recommendations": {
    "relatedActs": [], "relatedSections": [],
    "relatedLegalTopics": [], "relatedCourtProcedures": []
  }
}`;
  return generateStructuredResponse(prompt, language);
}

async function analyzeCaseFiling(scenario, category, language, userName) {
  const intent = classifyIntent(scenario);
  const ner    = extractEntities(scenario);
  const { expandedQuery } = expandQuery(scenario, intent);
  const hits = legalService.searchLaws(expandedQuery, { limit: 6 });

  const lawContext = hits.length > 0
    ? `\n\nRelevant laws:\n${hits.map(formatEntryForPrompt).join('\n')}`
    : '';

  const prompt = `You are an expert in Indian law and case filing procedures.${lawContext}

User's Legal Scenario: "${scenario}"
Category: ${category}
${userName ? `User Name: ${userName}` : ''}

Respond with a JSON object:
{
  "caseCategory": "Specific legal category",
  "applicableLaws": [], "applicableActs": [], "applicableSections": [],
  "legalRights": [], "requiredDocuments": [], "evidenceRequired": [],
  "courtToApproach": "", "governmentDepartment": "",
  "courtFees": "", "expectedTimeline": "",
  "filingProcedure": [], "alternativeRemedies": [],
  "mediationSuggestions": "",
  "draftComplaint": "Draft complaint in formal legal language",
  "draftLegalNotice": "Draft legal notice if applicable",
  "checklistBeforeFiling": [],
  "recommendations": {
    "relatedActs": [], "relatedSections": [],
    "relatedLegalTopics": [], "relatedCourtProcedures": []
  },
  "disclaimer": "AI-generated content disclaimer"
}`;
  return generateStructuredResponse(prompt, language);
}

async function searchKnowledgeBase(question, language = 'en') {
  const hits = legalService.searchLaws(question, { limit: 5 });
  const context = hits.length > 0
    ? `\n\nRelevant laws:\n${hits.map(formatEntryForPrompt).join('\n')}`
    : '';

  const prompt = `You are a legal knowledge assistant for Indian law.${context}

Question: "${question}"

Respond as a JSON object:
{
  "answer": "Comprehensive answer",
  "citations": ["Legal citations"],
  "relatedTopics": ["Related topics"],
  "recommendations": {
    "relatedActs": [], "relatedSections": [],
    "relatedLegalTopics": [], "relatedCourtProcedures": []
  }
}`;
  return generateStructuredResponse(prompt, language);
}

async function generateLegalDocument(documentType, details, language = 'en') {
  const prompt = `You are a legal document drafting expert for Indian law. Generate a professional ${documentType}.

Details:
${JSON.stringify(details, null, 2)}

Generate a formal, legally sound document following Indian legal standards.`;
  return generateContent(prompt, language);
}

module.exports = {
  processChatQuery,
  summarizeJudgment,
  analyzeCaseFiling,
  searchKnowledgeBase,
  generateLegalDocument,
};
