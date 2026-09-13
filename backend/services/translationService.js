const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function translateText(text, from = 'auto', to = 'en') {
  if (!text || !text.trim()) return text || '';
  if (from === to || from === 'auto' && to === 'en') {
    return text;
  }
  if (!OPENAI_API_KEY) {
    return text;
  }

  const payload = {
    model: process.env.OPENAI_CHAT_MODEL || 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a precise translator. Return only the translated text with no extra commentary.'
      },
      {
        role: 'user',
        content: `Translate this text from ${from === 'auto' ? 'detected language' : from} to ${to}:\n\n${text}`
      }
    ],
    temperature: 0.1,
    max_tokens: 500
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    console.warn('Translation failed, falling back to original text');
    return text;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || text;
}

module.exports = { translateText };
