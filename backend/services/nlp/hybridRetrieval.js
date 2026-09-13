/**
 * hybridRetrieval.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Deep-learning inspired hybrid retrieval pipeline:
 *
 *  Stage 1 — Multi-signal retrieval (no external API):
 *    A. BM25 sparse retrieval         (lexical precision)
 *    B. TF-IDF semantic matching      (domain vocabulary)
 *    C. NER-guided exact lookup       (pinpoint accuracy)
 *    D. Intent-filtered act search    (categorical precision)
 *
 *  Stage 2 — Reciprocal Rank Fusion (RRF):
 *    Merges the four result lists into one ranked list using
 *    RRF score = Σ 1/(k + rank_i) where k = 60.
 *
 *  Stage 3 — Gemini LLM Cross-encoder Re-ranking (optional):
 *    Sends top-N candidates to Gemini in a single batched call
 *    asking it to score each on relevance (0-10) to the query.
 *    Re-ranks based on Gemini's scores.
 *    Falls back gracefully if Gemini is unavailable.
 *
 *  Returns: Array of {entry, rrfScore, geminiScore, finalScore, signals}
 */

'use strict';

const { searchBM25 }      = require('./bm25Ranker');
const { searchSemantic }  = require('./semanticMatcher');
const legalService        = require('../legalService');

const RRF_K = 60; // Constant — reduces influence of outlier high-rank docs

// ── Reciprocal Rank Fusion ────────────────────────────────────────────────────
function rrfFuse(rankedLists, weights = []) {
  const scores = new Map(); // entryId → accumulated RRF score
  const entryMap = new Map(); // entryId → entry object
  const signalMap = new Map(); // entryId → {bm25, semantic, ner, intent}

  rankedLists.forEach((list, listIdx) => {
    const weight = weights[listIdx] || 1.0;
    list.forEach(({ entry, rank }) => {
      const id = `${entry.act_short}-${entry.section}`;
      const rrfScore = weight * (1 / (RRF_K + rank));
      scores.set(id, (scores.get(id) || 0) + rrfScore);
      entryMap.set(id, entry);

      if (!signalMap.has(id)) {
        signalMap.set(id, { bm25: 0, semantic: 0, ner: 0, intent: 0 });
      }
      const signals = signalMap.get(id);
      const sigKey = ['bm25', 'semantic', 'ner', 'intent'][listIdx] || 'other';
      signals[sigKey] = Math.round((1 / (RRF_K + rank)) * 1000) / 1000;
    });
  });

  const sorted = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, score]) => ({
      entry:     entryMap.get(id),
      rrfScore:  Math.round(score * 10000) / 10000,
      signals:   signalMap.get(id),
    }));

  return sorted;
}

// ── NER-guided retrieval ──────────────────────────────────────────────────────
function nerGuidedRetrieval(nerResult, limit = 10) {
  const results = [];
  let rank = 1;

  // Direct section lookups from NER
  for (const secRef of nerResult.sections || []) {
    const parts = secRef.split('-');
    const act     = parts.length > 1 ? parts[0] : null;
    const section = parts.slice(1).join('') || secRef;
    const entry = legalService.getSection(section, act);
    if (entry) results.push({ entry, rank: rank++, score: 1.0 });
    if (results.length >= limit) break;
  }

  // Context hint search
  for (const hint of nerResult.contextHints || []) {
    if (results.length >= limit) break;
    const hits = legalService.searchLaws(hint, { limit: 2 });
    hits.forEach(e => {
      const id = `${e.act_short}-${e.section}`;
      if (!results.find(r => `${r.entry.act_short}-${r.entry.section}` === id)) {
        results.push({ entry: e, rank: rank++, score: 0.8 });
      }
    });
  }

  return results;
}

// ── Intent-filtered retrieval ─────────────────────────────────────────────────
function intentFilteredRetrieval(expandedQuery, intentResult, limit = 10) {
  const actFilters = (intentResult.primaryActs || []).slice(0, 2);
  const results = [];
  let rank = 1;

  for (const act of actFilters) {
    if (results.length >= limit) break;
    const hits = legalService.searchLaws(expandedQuery, { actShort: act, limit: 5 });
    hits.forEach(e => {
      const id = `${e.act_short}-${e.section}`;
      if (!results.find(r => `${r.entry.act_short}-${r.entry.section}` === id)) {
        results.push({ entry: e, rank: rank++, score: 0.7 });
      }
    });
  }

  return results;
}

// ── Gemini cross-encoder re-ranker ────────────────────────────────────────────
async function geminiRerank(query, candidates, geminiModel, maxCandidates = 8) {
  if (!geminiModel || candidates.length === 0) return candidates;

  const top = candidates.slice(0, maxCandidates);

  // Build a batched scoring prompt
  const candList = top.map((c, i) =>
    `[${i + 1}] ${c.entry.act_short} §${c.entry.section} — ${c.entry.section_title}: ${
      String(c.entry.section_desc || '').substring(0, 200)
    }`
  ).join('\n');

  const prompt = `You are a precise Indian legal expert. Score each law section below on relevance to the query on a scale 0.0–10.0.

USER QUERY: "${query}"

LAW SECTIONS:
${candList}

Return ONLY a JSON array of numbers (one score per section in order), e.g. [8.5, 3.2, 7.0, ...]. No explanation.`;

  try {
    const result = await geminiModel.generateContent(prompt);
    const text   = result.response?.text?.() || '';
    const match  = text.match(/\[[\d.,\s]+\]/);
    if (!match) return candidates;

    const scores = JSON.parse(match[0]);
    if (!Array.isArray(scores) || scores.length !== top.length) return candidates;

    // Attach Gemini scores and re-sort
    top.forEach((c, i) => { c.geminiScore = typeof scores[i] === 'number' ? scores[i] : 5; });
    top.sort((a, b) => (b.geminiScore || 0) - (a.geminiScore || 0));

    // Compute finalScore = 0.4 * normalised_rrf + 0.6 * normalised_gemini
    const maxRrf     = Math.max(...top.map(c => c.rrfScore),     0.001);
    const maxGemini  = Math.max(...top.map(c => c.geminiScore || 0), 1);
    top.forEach(c => {
      c.finalScore = Math.round(
        (0.4 * (c.rrfScore / maxRrf) + 0.6 * ((c.geminiScore || 0) / maxGemini)) * 100
      );
    });

    // Append non-re-ranked candidates at end
    const remaining = candidates.slice(maxCandidates);
    return [...top, ...remaining];
  } catch {
    return candidates; // fallback: return unsorted candidates
  }
}

// ── Main hybrid retrieval function ────────────────────────────────────────────
/**
 * @param {string} originalQuery
 * @param {string} expandedQuery
 * @param {object} intentResult   — from intentClassifier
 * @param {object} nerResult      — from legalNER
 * @param {object} geminiModel    — optional, for re-ranking
 * @param {number} limit          — final result count
 * @returns {Promise<Array<{entry, rrfScore, geminiScore, finalScore, signals}>>}
 */
async function hybridRetrieve(
  originalQuery,
  expandedQuery,
  intentResult = {},
  nerResult    = {},
  geminiModel  = null,
  limit        = 12
) {
  const CANDIDATE_SIZE = Math.min(limit * 3, 30);

  // ── Stage 1: Run all four retrieval signals in parallel ───────────────────
  const [bm25Results, semanticResults] = await Promise.all([
    Promise.resolve(searchBM25(expandedQuery, { limit: CANDIDATE_SIZE })),
    Promise.resolve(searchSemantic(expandedQuery, { limit: CANDIDATE_SIZE })),
  ]);

  const nerResults    = nerGuidedRetrieval(nerResult, CANDIDATE_SIZE);
  const intentResults = intentFilteredRetrieval(expandedQuery, intentResult, CANDIDATE_SIZE);

  // ── Stage 2: Reciprocal Rank Fusion ──────────────────────────────────────
  // Weights: BM25=1.2, Semantic=1.0, NER=1.5 (highest — exact match), Intent=0.9
  const fused = rrfFuse(
    [bm25Results, semanticResults, nerResults, intentResults],
    [1.2,         1.0,             1.5,         0.9]
  );

  // Deduplicate: keep first occurrence of each act+section combo
  const seen = new Set();
  const deduped = fused.filter(c => {
    const id = `${c.entry.act_short}-${c.entry.section}`;
    if (seen.has(id)) return false;
    seen.add(id); return true;
  });

  // ── Stage 3: Gemini cross-encoder re-ranking ─────────────────────────────
  const topCandidates = deduped.slice(0, limit + 4);

  let reranked;
  if (geminiModel) {
    reranked = await geminiRerank(originalQuery, topCandidates, geminiModel, 8);
  } else {
    // Fallback: use RRF score as final score
    topCandidates.forEach(c => {
      c.geminiScore = null;
      c.finalScore  = Math.round(c.rrfScore * 10000);
    });
    reranked = topCandidates;
  }

  return reranked.slice(0, limit);
}

// ── Confidence scoring ────────────────────────────────────────────────────────
/**
 * Compute a retrieval confidence score (0-100) based on:
 *  - Number of signals that agree (multi-signal consensus)
 *  - Strength of top RRF score
 *  - Whether NER found explicit section references
 */
function computeRetrievalConfidence(results, nerResult) {
  if (results.length === 0) return 0;

  const topScore    = results[0].rrfScore;
  const multiSignal = results.filter(r =>
    Object.values(r.signals || {}).filter(v => v > 0).length >= 2
  ).length;

  let confidence = 40; // base
  confidence += Math.min(topScore * 3000, 25);  // top RRF score contribution
  confidence += Math.min(multiSignal * 5, 20);  // multi-signal consensus
  if ((nerResult.sections || []).length > 0) confidence += 15; // explicit NER hit

  return Math.min(Math.round(confidence), 98);
}

module.exports = { hybridRetrieve, computeRetrievalConfidence };
