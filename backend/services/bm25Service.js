const fs = require('fs');
const path = require('path');

function tokenize(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function buildBM25Index(laws) {
  const docs = laws.map((entry, idx) => {
    const text = [entry.act, entry.act_short, entry.section, entry.section_title, entry.section_desc, entry.keywords || '']
      .filter(Boolean)
      .join(' ');
    return {
      id: entry.id || `${entry.act_short || entry.act}_${entry.section || idx}`,
      text,
      meta: {
        act: entry.act,
        act_short: entry.act_short,
        section: entry.section,
        section_title: entry.section_title,
        keywords: entry.keywords || ''
      }
    };
  });

  const docFreq = new Map();
  const docLengths = new Map();
  const tokensByDoc = docs.map((d) => {
    const tokens = tokenize(d.text);
    docLengths.set(d.id, tokens.length);
    const counts = new Map();
    for (const t of tokens) {
      counts.set(t, (counts.get(t) || 0) + 1);
      docFreq.set(t, (docFreq.get(t) || 0) + 1);
    }
    return { id: d.id, counts };
  });

  const avgDocLength = docs.reduce((sum, d) => sum + (docLengths.get(d.id) || 0), 0) / Math.max(1, docs.length);
  const k1 = 1.5;
  const b = 0.75;

  function score(query, doc) {
    const qs = tokenize(query);
    if (!qs.length) return 0;
    let total = 0;
    for (const q of qs) {
      const idf = Math.log((docs.length - (docFreq.get(q) || 0) + 0.5) / ((docFreq.get(q) || 0) + 0.5) + 1);
      const count = doc.counts.get(q) || 0;
      const dl = docLengths.get(doc.id) || 0;
      const denom = 1 + k1 * ((1 - b) + b * (dl / avgDocLength));
      total += idf * ((count * (k1 + 1)) / (count + denom));
    }
    return total;
  }

  return { docs, tokensByDoc, score };
}

function searchBM25(query, laws, k = 5) {
  const index = buildBM25Index(laws);
  const scored = index.docs.map(doc => ({ id: doc.id, score: index.score(query, index.tokensByDoc.find(t => t.id === doc.id)), text: doc.text, meta: doc.meta }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

module.exports = { buildBM25Index, searchBM25 };
