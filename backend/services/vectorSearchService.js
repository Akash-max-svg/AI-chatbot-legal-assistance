const fs = require('fs');
const path = require('path');

// Simple in-memory vector store + brute-force cosine search for a minimal prototype.
// Replace with FAISS or a proper ANN library later for performance.

let index = null; // { items: [{id, embedding, text, meta}], dim }

function loadIndex(indexPath) {
  indexPath = indexPath || path.join(__dirname, '..', 'data', 'embeddings.json');
  if (!fs.existsSync(indexPath)) throw new Error('embeddings.json not found at ' + indexPath);
  const arr = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  index = { items: arr, dim: arr.length > 0 ? arr[0].embedding.length : 0 };
  console.log(`Loaded ${arr.length} vectors (dim=${index.dim})`);
  return index;
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function searchByEmbedding(queryEmbedding, k = 5) {
  if (!index) throw new Error('Index not loaded — call loadIndex() first');
  const scores = index.items.map(it => ({ id: it.id, score: cosine(it.embedding, queryEmbedding), text: it.text, meta: it.meta }));
  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, k);
}

module.exports = { loadIndex, searchByEmbedding };
