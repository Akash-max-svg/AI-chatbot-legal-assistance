/*
  One-off script to build embeddings for all entries in backend/data/laws.json
  Usage: node backend/data/build_embeddings.js
  Requires: OPENAI_API_KEY in environment
*/

const { buildEmbeddingsFromLaws } = require('../services/embeddingsService');

(async () => {
  try {
    const out = await buildEmbeddingsFromLaws({});
    console.log('Embeddings build complete:', out);
  } catch (err) {
    console.error('Error building embeddings:', err);
  }
})();
