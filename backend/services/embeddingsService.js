const fs = require('fs');
const path = require('path');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
const BATCH_SIZE = 64;

if (!OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not set — embeddings calls will fail until it is provided in environment.');
}

async function callOpenAIEmbeddings(inputs) {
  // inputs: array of strings
  const url = 'https://api.openai.com/v1/embeddings';
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: inputs })
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenAI embeddings error: ${resp.status} ${text}`);
  }
  const j = await resp.json();
  return j.data.map(d => d.embedding);
}

async function buildEmbeddingsFromLaws({ lawsPath, outPath }) {
  lawsPath = lawsPath || path.join(__dirname, '..', 'data', 'laws.json');
  outPath = outPath || path.join(__dirname, '..', 'data', 'embeddings.json');

  if (!fs.existsSync(lawsPath)) throw new Error('laws.json not found at ' + lawsPath);
  const laws = JSON.parse(fs.readFileSync(lawsPath, 'utf8'));

  const items = laws.map((entry, idx) => {
    const id = entry.id || `${entry.act_short || entry.act}_${entry.section || idx}`;
    // join a compact text to embed
    const text = `${entry.act || ''} ${entry.act_short || ''} Section ${entry.section || ''} ${entry.section_title || ''} ${entry.section_desc || ''}`;
    return { id, text, meta: { act: entry.act, act_short: entry.act_short, section: entry.section, section_title: entry.section_title } };
  });

  const out = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const inputs = batch.map(b => b.text);
    console.log(`Embedding batch ${i}/${items.length}`);
    const embeddings = await callOpenAIEmbeddings(inputs);
    for (let j = 0; j < batch.length; j++) {
      out.push({ id: batch[j].id, embedding: embeddings[j], text: batch[j].text, meta: batch[j].meta });
    }
  }

  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`Wrote ${out.length} embeddings to ${outPath}`);
  return outPath;
}

async function embedText(text) {
  if (!text) return [];
  const arr = Array.isArray(text) ? text : [text];
  const embeddings = await callOpenAIEmbeddings(arr);
  return embeddings[0];
}

module.exports = { buildEmbeddingsFromLaws, embedText };
