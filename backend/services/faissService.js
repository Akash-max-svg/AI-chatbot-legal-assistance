/*
  FAISS service scaffold. This file provides a clear integration point for swapping in FAISS or other ANN libraries.
  It intentionally avoids adding native dependencies in this prototype. To enable FAISS in production:
  1. Install and configure a Node binding for FAISS or run a separate FAISS process and talk gRPC/HTTP to it.
  2. Update loadIndex and search functions to use that library for fast ANN search.

  Current behavior: fall back to in-memory search via vectorSearchService if FAISS is not available.
*/

let faissAvailable = false;
let faiss = null;
try {
  // try to require a faiss binding if present (optional)
  faiss = require('faiss');
  faissAvailable = true;
} catch (err) {
  faissAvailable = false;
}

// Placeholder interface
async function buildFaissIndex(embeddingsPath, indexOutPath) {
  if (!faissAvailable) {
    throw new Error('FAISS is not available in this runtime. Install a FAISS binding or run FAISS externally.');
  }
  // Example: load embeddings and build index using the binding
  // This is intentionally left as a placeholder since FAISS bindings vary.
}

async function searchFaiss(queryEmbedding, k = 5) {
  if (!faissAvailable) throw new Error('FAISS not available');
  // call into the binding
  return faiss.search(queryEmbedding, k);
}

module.exports = { faissAvailable, buildFaissIndex, searchFaiss };
