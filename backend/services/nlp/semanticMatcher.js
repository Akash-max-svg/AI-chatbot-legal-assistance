/**
 * semanticMatcher.js
 * ─────────────────────────────────────────────────────────────────────────────
 * In-process semantic similarity using TF-IDF sparse vectors + cosine similarity.
 *
 * While not a true neural embedding, sparse TF-IDF on a domain-specific
 * legal corpus captures strong semantic relationships between legal terms.
 * Combined with BM25 via RRF fusion, this gives RAG-quality retrieval without
 * any external API call.
 *
 * Build once: computes TF-IDF vectors for all 8325 law entries.
 * Search: vectorises query, computes cosine similarity against all docs.
 *
 * For even better semantic matching, the query expansion from queryExpander.js
 * is applied first, which effectively simulates semantic neighbourhood.
 */

'use strict';

const path = require('path');
const fs   = require('fs');

// ── Load corpus ───────────────────────────────────────────────────────────────
let corpus = [];
try {
  const raw = fs.readFileSync(
    path.join(__dirname, '../../data/laws.json'), 'utf8'
  ).replace(/^\uFEFF/, '');
  corpus = JSON.parse(raw);
} catch {
  try {
    corpus = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../../data/ipc.json'), 'utf8')
        .replace(/^\uFEFF/, '')
    );
  } catch { corpus = []; }
}

// ── Tokenisation ─────────────────────────────────────────────────────────────
const STOP_WORDS = new Set([
  'the','a','an','of','in','to','or','and','is','are','be','by','for','on',
  'with','at','from','this','that','which','such','any','all','shall','may',
  'not','no','as','its','his','her','their','been','was','were','will','if',
  'when','where','who','whom','what','has','have','had','upon','under','over',
  'into','out','per','said','every','each','person','court','act','law',
]);

function tokenise(text) {
  // Also extract bi-grams from short collocations
  const words = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOP_WORDS.has(t));

  // Add bi-grams for important legal multi-word expressions
  const bigrams = [];
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.push(`${words[i]}_${words[i + 1]}`);
  }
  return [...words, ...bigrams];
}

// Build document text (title weighted 3x, keywords 2x)
function docText(entry) {
  const t = String(entry.section_title || '');
  const d = String(entry.section_desc  || '').substring(0, 400);
  const k = (entry.keywords || []).join(' ');
  const a = String(entry.act_short || '');
  return `${t} ${t} ${t} ${a} ${a} ${k} ${k} ${d}`;
}

// ── Build TF-IDF index ────────────────────────────────────────────────────────
console.log(`[SemanticMatcher] Building TF-IDF vectors for ${corpus.length} entries...`);
const tsBuild = Date.now();

const N = corpus.length || 1;

// Step 1: tokenise all docs
const allDocTokens = corpus.map(e => tokenise(docText(e)));

// Step 2: build df (document frequency) per term
const df = new Map();
allDocTokens.forEach(tokens => {
  const seen = new Set(tokens);
  seen.forEach(t => df.set(t, (df.get(t) || 0) + 1));
});

// Step 3: compute IDF per term (smooth: log((N+1)/(df+1))+1)
const idfMap = new Map();
for (const [term, freq] of df.entries()) {
  idfMap.set(term, Math.log((N + 1) / (freq + 1)) + 1);
}

// Step 4: compute TF-IDF sparse vector per document + L2-normalise
function buildDocVector(tokens) {
  const tf = {};
  const len = tokens.length || 1;
  tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
  const vec = {};
  let norm = 0;
  Object.entries(tf).forEach(([t, f]) => {
    const v = (f / len) * (idfMap.get(t) || 1);
    vec[t] = v;
    norm += v * v;
  });
  const sqrtNorm = Math.sqrt(norm) || 1;
  Object.keys(vec).forEach(t => { vec[t] /= sqrtNorm; });
  return vec;
}

const docVectors = allDocTokens.map(buildDocVector);
console.log(`[SemanticMatcher] TF-IDF index ready in ${Date.now() - tsBuild}ms`);

// ── Query similarity search ───────────────────────────────────────────────────
/**
 * @param {string} query
 * @param {{ limit?: number, actFilter?: string }} opts
 * @returns {Array<{entry, score, rank}>}
 */
function searchSemantic(query, { limit = 15, actFilter } = {}) {
  if (!query || corpus.length === 0) return [];

  const qTokens = tokenise(query);
  if (qTokens.length === 0) return [];

  // Build and L2-normalise query vector
  const rawQVec = buildDocVector(qTokens);

  // Compute dot product (since both vecs are L2-normalised, this equals cosine sim)
  const scores = [];
  docVectors.forEach((dVec, idx) => {
    if (actFilter && corpus[idx].act_short !== actFilter.toUpperCase()) return;

    let dot = 0;
    // Iterate over the smaller of query or doc keys
    for (const t of Object.keys(rawQVec)) {
      if (dVec[t]) dot += rawQVec[t] * dVec[t];
    }
    if (dot > 0) scores.push({ idx, score: dot });
  });

  scores.sort((a, b) => b.score - a.score);
  const top = scores.slice(0, limit);

  return top.map(({ idx, score }, rank) => ({
    entry: corpus[idx],
    score: Math.round(score * 10000) / 10000,
    rank:  rank + 1,
  }));
}

function searchSemanticEntries(query, opts = {}) {
  return searchSemantic(query, opts).map(r => r.entry);
}

module.exports = { searchSemantic, searchSemanticEntries };
