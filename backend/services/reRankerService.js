const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MAX_RERANK_DOCS = Number(process.env.MAX_RERANK_DOCS || 10);

async function rerankWithLLM(query, hits) {
  if (!OPENAI_API_KEY || !Array.isArray(hits) || hits.length === 0) {
    return hits;
  }

  const docs = hits.slice(0, MAX_RERANK_DOCS).map((h, idx) => ({ idx, title: h.meta?.section_title || h.meta?.act_short || 'Law', text: h.text || '' }));
  const body = {
    model: process.env.OPENAI_CHAT_MODEL || 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'Rank the documents by relevance to the user query. Return only valid JSON array with objects {index, score}. Score should be between 0 and 1.'
      },
      {
        role: 'user',
        content: `Query: ${query}\n\nDocuments:\n${docs.map(d => `[${d.idx}] ${d.title}: ${d.text.slice(0, 400)}`).join('\n\n')}`
      }
    ],
    temperature: 0.1,
    max_tokens: 500
  };

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      return hits;
    }

    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content || '[]';
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    if (!Array.isArray(parsed)) return hits;

    const ranking = new Map();
    for (const item of parsed) {
      if (typeof item.index === 'number') ranking.set(item.index, Number(item.score) || 0);
    }

    return hits
      .map((h, idx) => ({ ...h, rerankScore: ranking.get(idx) || 0 }))
      .sort((a, b) => (b.rerankScore || 0) - (a.rerankScore || 0));
  } catch (err) {
    console.warn('Re-ranking failed, using original rank:', err.message);
    return hits;
  }
}

module.exports = { rerankWithLLM };
