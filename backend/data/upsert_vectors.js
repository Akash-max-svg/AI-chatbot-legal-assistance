/*
  Upsert embeddings for specific law entries.
  Usage: node backend/data/upsert_vectors.js [comma-separated-id-list]
  Example: node backend/data/upsert_vectors.js MOCK_1,MOCK_2

  Requires: OPENAI_API_KEY set in environment to call embedText().
*/

const fs = require('fs');
const path = require('path');
const { embedText } = require('../../services/embeddingsService');

async function loadEmbeddings(filePath) {
  if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return [];
}

async function upsert(ids) {
  const lawsPath = path.join(__dirname, 'laws.json');
  const embPath = path.join(__dirname, 'embeddings.json');
  if (!fs.existsSync(lawsPath)) throw new Error('laws.json not found');
  const laws = JSON.parse(fs.readFileSync(lawsPath, 'utf8'));
  const existing = await loadEmbeddings(embPath);
  const existingMap = new Map(existing.map(e => [e.id, e]));

  const toUpsert = laws.filter(l => ids.includes((l.id) ? String(l.id) : `${l.act_short || l.act}_${l.section}`));
  if (!toUpsert.length) {
    console.log('No matching law entries found for provided ids');
    return;
  }

  for (const item of toUpsert) {
    const id = item.id || `${item.act_short || item.act}_${item.section}`;
    const text = `${item.act || ''} ${item.act_short || ''} Section ${item.section || ''} ${item.section_title || ''} ${item.section_desc || ''}`;
    console.log('Embedding upsert for', id);
    try {
      const emb = await embedText(text);
      existingMap.set(id, { id, embedding: emb, text, meta: { act: item.act, act_short: item.act_short, section: item.section, section_title: item.section_title } });
    } catch (err) {
      console.error('Embedding failed for', id, err.message || err);
    }
  }

  const merged = Array.from(existingMap.values());
  fs.writeFileSync(embPath, JSON.stringify(merged, null, 2));
  console.log('Upsert complete — embeddings.json updated with', ids.length, 'items');
}

(async () => {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Provide comma-separated ids to upsert as first arg');
    process.exit(1);
  }
  const ids = arg.split(',').map(s => s.trim());
  try {
    await upsert(ids);
  } catch (err) {
    console.error('Upsert failed:', err.message || err);
  }
})();
