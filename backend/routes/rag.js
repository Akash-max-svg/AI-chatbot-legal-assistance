const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const { embedText } = require('../services/embeddingsService');
const { loadIndex, searchByEmbedding } = require('../services/vectorSearchService');
const { detectLanguage } = require('../services/languageService');
const { translateText } = require('../services/translationService');
const { hybridSearch } = require('../services/retrievalService');
const { rerankWithLLM } = require('../services/reRankerService');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-3.5-turbo';

// Cost and usage safeguards
const MAX_TOKENS_PER_CALL = Number(process.env.MAX_TOKENS_PER_CALL || 700);
const MAX_RERANK_DOCS = Number(process.env.MAX_RERANK_DOCS || 10);
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000); // 1 minute
const RATE_LIMIT_MAX_REQ = Number(process.env.RATE_LIMIT_MAX_REQ || 60); // per IP per window

let useMock = false;
if (!OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY not set — chat calls will run in mock mode unless embeddings exist');
}

// Simple in-memory rate limiter per IP
const rateMap = new Map(); // ip -> [timestamps]
function checkRateLimit(ip) {
  const now = Date.now();
  const arr = rateMap.get(ip) || [];
  // remove old
  const recent = arr.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  rateMap.set(ip, recent);
  return recent.length <= RATE_LIMIT_MAX_REQ;
}

// Simple request logger
function logRequest(info) {
  try {
    const logsDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
    const logPath = path.join(logsDir, 'rag_requests.log');
    const line = `${new Date().toISOString()} | ${info.ip} | ${(info.query||'').replace(/\n/g, ' ')} | mock=${info.mock} | detected=${info.detectedLanguage || ''} | translated=${info.translated || false}\n`;
    fs.appendFileSync(logPath, line);
  } catch (err) {
    console.warn('Failed to write rag log:', err.message || err);
  }
}

// Ensure index loads on first request
let indexLoaded = false;
function ensureIndexLoaded() {
  if (indexLoaded || useMock) return;
  const idxPath = path.join(__dirname, '..', 'data', 'embeddings.json');
  if (!fs.existsSync(idxPath) || !OPENAI_API_KEY) {
    // fallback to mock mode if embeddings or API key not available
    console.warn('Embeddings index or API key not available — switching to mock retrieval mode');
    useMock = true;
    return;
  }
  loadIndex(idxPath);
  indexLoaded = true;
}

async function callOpenAIChat(messages, max_tokens = 512) {
  const url = 'https://api.openai.com/v1/chat/completions';
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({ model: CHAT_MODEL, messages, max_tokens })
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`OpenAI chat error: ${resp.status} ${txt}`);
  }
  const j = await resp.json();
  return j.choices && j.choices[0] && j.choices[0].message ? j.choices[0].message.content : '';
}

// POST /api/rag  { query: string, k?: number }
router.post('/', async (req, res, next) => {
  try {
    const { query, k = 5 } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.ip || req.connection && req.connection.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) return res.status(429).json({ error: 'rate limit exceeded' });
    if (!query) return res.status(400).json({ error: 'query required' });

    ensureIndexLoaded();


    const detectedLanguage = detectLanguage(query);
    let queryForSearch = query;
    let translated = false;
    if (detectedLanguage !== 'en') {
      queryForSearch = await translateText(query, detectedLanguage, 'en');
      translated = queryForSearch !== query;
    }

    // If running in mock mode, return synthetic hits and a canned answer
    if (useMock) {
      const lawsPath = path.join(__dirname, '..', 'data', 'laws.json');
      let sampleHits = [];
      if (fs.existsSync(lawsPath)) {
        const laws = JSON.parse(fs.readFileSync(lawsPath, 'utf8'));
        for (let i = 0; i < Math.min(k, laws.length); i++) {
          const e = laws[i];
          sampleHits.push({ id: e.id || `${e.act_short || e.act}_${e.section || i}`, score: 0.9 - i * 0.1, text: (e.section_desc || e.section_title || '').slice(0, 800), meta: { act: e.act, act_short: e.act_short, section: e.section, section_title: e.section_title } });
        }
      } else {
        for (let i = 0; i < k; i++) sampleHits.push({ id: `mock_${i+1}`, score: 0.5, text: `Mock snippet for result ${i+1}`, meta: { act: 'Mock Act', act_short: 'MOCK', section: `${i+1}`, section_title: `Mock section ${i+1}` } });
      }

      const citations = sampleHits.map((h, idx) => `[[${idx+1}]] ${h.meta.act_short || h.meta.act} Sec ${h.meta.section}`).join(', ');
      const answer = `This is a mock answer for query: "${query}". Top sources: ${citations}.`;
      try { logRequest({ ip, query, mock: true, detectedLanguage, translated }); } catch(e){}
      return res.json({ answer, hits: sampleHits, mock: true, detectedLanguage, translated, queryForSearch });
    }

    // 1) embed query
    const qEmbedding = await embedText(queryForSearch);

    // 2) retrieve top-k via vector search and BM25 hybrid retrieval
    const lawsPath = path.join(__dirname, '..', 'data', 'laws.json');
    const laws = fs.existsSync(lawsPath) ? JSON.parse(fs.readFileSync(lawsPath, 'utf8')) : [];
    const denseHits = searchByEmbedding(qEmbedding, Math.max(k, 5));
    const hybridHits = await hybridSearch(queryForSearch, laws, (q, top) => searchByEmbedding(qEmbedding, top), { k });

    // 3) re-rank if possible
    let rerankedHits = hybridHits;
    if (OPENAI_API_KEY) {
      rerankedHits = await rerankWithLLM(queryForSearch, hybridHits);
    }

    // 4) assemble prompt
    const contextText = rerankedHits.map((h, i) => `[[${i + 1}]] Act: ${h.meta.act || h.meta.act_short} Section: ${h.meta.section}\nTitle: ${h.meta.section_title}\nSnippet: ${(h.text || '').slice(0, 800)}`).join('\n\n');

    const system = {
      role: 'system',
      content: 'You are a legal assistant. Answer concisely and cite sources using the [[n]] markers from the provided context. If you are uncertain, say so and provide the relevant citations.'
    };
    const userMsg = { role: 'user', content: `Question: ${queryForSearch}\n\nContext:\n${contextText}\n\nRespond with a concise answer and include citation markers like [[1]] to reference the context items.` };

    // 5) call OpenAI Chat
    let answer = await callOpenAIChat([system, userMsg], 700);
    if (detectedLanguage !== 'en' && translated && OPENAI_API_KEY) {
      answer = await translateText(answer, 'en', detectedLanguage);
    }

    // 6) return answer + citations + raw hits
    try { logRequest({ ip, query, mock: false, detectedLanguage, translated }); } catch(e){}
    res.json({ answer, hits: rerankedHits, mock: false, detectedLanguage, translated, queryForSearch, used_re_ranker: !!OPENAI_API_KEY });
  } catch (err) {
    next(err);
  }
});

// GET /api/rag/diagnostics?q=...
router.get('/diagnostics', async (req, res, next) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: 'q query param required' });
    ensureIndexLoaded();
    if (useMock) {
      // return top sample items
      const lawsPath = path.join(__dirname, '..', 'data', 'laws.json');
      let sampleHits = [];
      if (fs.existsSync(lawsPath)) {
        const laws = JSON.parse(fs.readFileSync(lawsPath, 'utf8'));
        for (let i = 0; i < Math.min(10, laws.length); i++) {
          const e = laws[i];
          sampleHits.push({ id: e.id || `${e.act_short || e.act}_${e.section || i}`, score: 0.9 - i * 0.01, text: (e.section_desc || e.section_title || '').slice(0, 800), meta: { act: e.act, act_short: e.act_short, section: e.section, section_title: e.section_title } });
        }
      } else {
        for (let i = 0; i < 10; i++) sampleHits.push({ id: `mock_${i+1}`, score: 0.5, text: `Mock snippet for result ${i+1}`, meta: { act: 'Mock Act', act_short: 'MOCK', section: `${i+1}`, section_title: `Mock section ${i+1}` } });
      }
      return res.json({ query: q, hits: sampleHits, mock: true });
    }
    const qEmbedding = await embedText(q);
    const hits = searchByEmbedding(qEmbedding, 10);
    res.json({ query: q, hits });
  } catch (err) {
    next(err);
  }
});

// POST /api/rag/reindex  (protected by ADMIN_KEY in env) - rebuild embeddings and BM25 index
router.post('/reindex', async (req, res, next) => {
  try {
    const adminKey = process.env.ADMIN_KEY;
    const provided = req.headers['x-admin-key'] || req.body.adminKey;
    if (adminKey && provided !== adminKey) {
      return res.status(403).json({ error: 'admin key required or incorrect' });
    }

    const { buildEmbeddings } = require('../services/embeddingsService');
    // Build BM25 always (no key needed)
    const lawsPath = path.join(__dirname, '..', 'data', 'laws.json');
    const laws = fs.existsSync(lawsPath) ? JSON.parse(fs.readFileSync(lawsPath, 'utf8')) : [];

    // If OpenAI key is present, run embeddings build; otherwise return info about missing key
    if (!process.env.OPENAI_API_KEY) {
      return res.json({ ok: false, reason: 'OPENAI_API_KEY not set. BM25 can be rebuilt locally; embeddings require API key.' });
    }

    // run build
    try {
      // call the buildEmbeddingsFromLaws if available
      const embService = require('../services/embeddingsService');
      await embService.buildEmbeddingsFromLaws({});
      // clear loaded index so it reloads next request
      indexLoaded = false;
      useMock = false;
      return res.json({ ok: true, message: 'Embeddings build started/completed' });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message || err });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
