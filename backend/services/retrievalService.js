const { searchByEmbedding } = require('./vectorSearchService');
const { searchBM25 } = require('./bm25Service');

function blendRanks(denseHits, sparseHits, options = {}) {
  const alpha = options.alpha ?? 0.6;
  const beta = options.beta ?? 0.4;
  const denseMap = new Map();
  for (const h of denseHits) denseMap.set(h.id, h);

  const merged = new Map();
  for (const h of denseHits) {
    merged.set(h.id, { ...h, denseScore: h.score || 0, sparseScore: 0, finalScore: alpha * (h.score || 0) });
  }
  for (const h of sparseHits) {
    const existing = merged.get(h.id) || { id: h.id, text: h.text, meta: h.meta };
    const denseScore = denseMap.get(h.id)?.score || 0;
    const sparseScore = h.score || 0;
    existing.denseScore = denseScore;
    existing.sparseScore = sparseScore;
    existing.finalScore = alpha * denseScore + beta * sparseScore;
    merged.set(h.id, existing);
  }

  return [...merged.values()].sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
}

async function hybridSearch(query, laws, vectorSearchFn, options = {}) {
  const k = options.k ?? 5;
  const denseHits = vectorSearchFn ? vectorSearchFn(query, k * 3) : [];
  const sparseHits = searchBM25(query, laws, k * 3);
  const merged = blendRanks(denseHits, sparseHits, options);
  return merged.slice(0, k);
}

module.exports = { blendRanks, hybridSearch };
