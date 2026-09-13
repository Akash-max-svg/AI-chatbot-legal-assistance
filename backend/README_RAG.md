check the work progreess is donne
RAG & embeddings quick runbook

Files added:
- services/faissService.js        (FAISS scaffold)
- services/languageService.js    (language detection)
- services/translationService.js (translation wrapper using OpenAI)
- services/bm25Service.js        (BM25 builder/search)
- services/retrievalService.js   (dense+sparse fusion)
- services/reRankerService.js    (OpenAI-based reranker)
- services/embeddingsService.js  (existing; embedding builder)
- services/vectorSearchService.js(existing; in-memory vector search)
- routes/rag.js                  (RAG endpoints; POST /api/rag, GET /api/rag/diagnostics, POST /api/rag/reindex)
- data/build_embeddings.js       (embedding builder script)
- data/upsert_vectors.js         (upsert embeddings for specific IDs)

Quick commands:
- Build embeddings (requires OPENAI_API_KEY set in env):
  $env:OPENAI_API_KEY = 'sk-...'
  node backend/data/build_embeddings.js

- Upsert specific entries (requires key):
  node backend/data/upsert_vectors.js ID1,ID2,ID3

- Trigger reindex via HTTP (protected):
  curl -X POST http://localhost:5000/api/rag/reindex -H "Content-Type: application/json" -d '{}' -H "x-admin-key: <ADMIN_KEY>"

Notes:
- The system includes a mock mode (no API key or missing embeddings.json) so you can test /api/rag and diagnostics without any keys.
- For production, install a FAISS binding or run a dedicated vector store and update services/faissService.js accordingly.
- Rotate API keys immediately if any were ever exposed in chat.
