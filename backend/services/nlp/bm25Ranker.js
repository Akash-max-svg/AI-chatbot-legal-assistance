/**
 * bm25Ranker.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Okapi BM25 implementation over the laws database.
 *   k1 = 1.5  (term frequency saturation)
 *   b  = 0.75 (length normalisation)
 *
 * The index is built once at module load from laws.json and kept in memory.
 * Tokenisation: lowercase, remove punctuation except hyphens, split on whitespace.
 *
 * Exported:  searchBM25(query, { limit, actFilter, categoryFilter })
 */

'use strict';

const path = require('path');
const fs   = require('fs');

const K1 = 1.5;
const B  = 0.75;

// ── Load corpus ───────────────────────────────────────────────────────────────
let corpus = [];
try {
  const raw = fs.readFileSync(path.join(__dirname, '../../data/laws.json'), 'utf8')
                .replace(/^\uFEFF/, '');
  corpus = JSON.parse(raw);
} catch {
  try {
    const raw = fs.readFileSync(path.join(__dirname, '../../data/ipc.json'), 'utf8')
                  .replace(/^\uFEFF/, '');
    corpus = JSON.parse(raw);
  } catch { corpus = []; }
}

// ── Tokeniser ─────────────────────────────────────────────────────────────────
const STOP_WORDS = new Set([
  'the','a','an','of','in','to','or','and','is','are','be','by','for','on',
  'with','at','from','this','that','which','such','any','all','shall','may',
  'not','no','as','its','his','her','their','been','was','were','will','if',
  'when','where','who','whom','what','has','have','had','do','does','did',
  'can','could','should','would','will','upon','under','over','into','out',
]);

function tokenise(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOP_WORDS.has(t));
}

// Build a document text from an entry — title gets extra weight via repetition
function docText(entry) {
  const title = String(entry.section_title || '');
  const desc  = String(entry.section_desc  || '');
  const kw    = (entry.keywords || []).join(' ');
  const act   = String(entry.act_short || '');
  // Triple the title tokens to boost title-matching
  return `${title} ${title} ${title} ${act} ${kw} ${desc}`;
}

// ── Build BM25 index ─────────────────────────────────────────────────────────
console.log(`[BM25] Indexing ${corpus.length} law entries...`);
const startTs = Date.now();

// Tokenise every document once
const docTokens = corpus.map(entry => tokenise(docText(entry)));

// Average document length
const totalTokens = docTokens.reduce((sum, toks) => sum + toks.length, 0);
const avgDL = corpus.length > 0 ? totalTokens / corpus.length : 1;

// Build inverted index: term → Map<docIdx, tf>
const invertedIndex = new Map();
docTokens.forEach((tokens, idx) => {
  const tf = {};
  tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
  Object.entries(tf).forEach(([term, freq]) => {
    if (!invertedIndex.has(term)) invertedIndex.set(term, new Map());
    invertedIndex.get(term).set(idx, freq);
  });
});

// Compute IDF for each term: log((N - df + 0.5) / (df + 0.5) + 1)
const N = corpus.length;
const termIDF = new Map();
for (const [term, docMap] of invertedIndex.entries()) {
  const df = docMap.size;
  termIDF.set(term, Math.log((N - df + 0.5) / (df + 0.5) + 1));
}

console.log(`[BM25] Index built in ${Date.now() - startTs}ms`);

// ── BM25 scoring ─────────────────────────────────────────────────────────────
/**
 * @param {string} query
 * @param {{ limit?: number, actFilter?: string, categoryFilter?: string }} opts
 * @returns {Array<{entry, score, rank}>}
 */
function searchBM25(query, { limit = 15, actFilter, categoryFilter } = {}) {
  const queryTokens = tokenise(query);
  if (queryTokens.length === 0) return [];

  // Collect candidate docs from inverted index
  const scores = new Map(); // docIdx → score

  for (const qTerm of queryTokens) {
    const postings = invertedIndex.get(qTerm);
    if (!postings) continue;

    const idf = termIDF.get(qTerm) || 0;

    for (const [idx, tf] of postings.entries()) {
      // Apply act/category filter at scoring time
      if (actFilter && corpus[idx].act_short !== actFilter.toUpperCase()) continue;
      if (categoryFilter && !corpus[idx].category?.includes(categoryFilter)) continue;

      const dl   = docTokens[idx].length;
      const norm = tf * (K1 + 1) / (tf + K1 * (1 - B + B * (dl / avgDL)));
      const inc  = idf * norm;
      scores.set(idx, (scores.get(idx) || 0) + inc);
    }
  }

  // Sort by score
  const sorted = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  return sorted.map(([idx, score], rank) => ({
    entry: corpus[idx],
    score: Math.round(score * 1000) / 1000,
    rank:  rank + 1,
  }));
}

// ── Convenience: get entries only ────────────────────────────────────────────
function searchBM25Entries(query, opts = {}) {
  return searchBM25(query, opts).map(r => r.entry);
}

module.exports = { searchBM25, searchBM25Entries };
