const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

const languageInstructions = {
  en: 'Respond in English.',
  hi: 'Respond in Hindi (Devanagari script).',
  te: 'Respond in Telugu.',
  ta: 'Respond in Tamil.',
  kn: 'Respond in Kannada.',
  ml: 'Respond in Malayalam.',
  mr: 'Respond in Marathi.',
  gu: 'Respond in Gujarati.',
  pa: 'Respond in Punjabi (Gurmukhi script).',
  bn: 'Respond in Bengali.',
  ur: 'Respond in Urdu.',
  or: 'Respond in Odia.',
  as: 'Respond in Assamese.',
  kok: 'Respond in Konkani.',
  ne: 'Respond in Nepali.',
  mni: 'Respond in Manipuri (Meitei script).',
  sa: 'Respond in Sanskrit (Devanagari script).'
};

const supportedLanguages = [
  { code: 'en', label: 'English', voiceLocale: 'en-IN' },
  { code: 'hi', label: 'Hindi', voiceLocale: 'hi-IN' },
  { code: 'te', label: 'Telugu', voiceLocale: 'te-IN' },
  { code: 'ta', label: 'Tamil', voiceLocale: 'ta-IN' },
  { code: 'kn', label: 'Kannada', voiceLocale: 'kn-IN' },
  { code: 'ml', label: 'Malayalam', voiceLocale: 'ml-IN' },
  { code: 'mr', label: 'Marathi', voiceLocale: 'mr-IN' },
  { code: 'gu', label: 'Gujarati', voiceLocale: 'gu-IN' },
  { code: 'pa', label: 'Punjabi', voiceLocale: 'pa-IN' },
  { code: 'bn', label: 'Bengali', voiceLocale: 'bn-IN' },
  { code: 'ur', label: 'Urdu', voiceLocale: 'ur-IN' },
  { code: 'or', label: 'Odia', voiceLocale: 'or-IN' },
  { code: 'as', label: 'Assamese', voiceLocale: 'as-IN' },
  { code: 'kok', label: 'Konkani', voiceLocale: 'kok-IN' },
  { code: 'ne', label: 'Nepali', voiceLocale: 'ne-IN' },
  { code: 'mni', label: 'Manipuri', voiceLocale: 'mni-IN' },
  { code: 'sa', label: 'Sanskrit', voiceLocale: 'sa-IN' }
];

async function generateContent(prompt, language = 'en') {
  try {
    const langInstruction = languageInstructions[language] || languageInstructions.en;
    const fullPrompt = `${langInstruction}\n\n${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('AI Generation Error:', error);
    throw new Error('Failed to generate AI response');
  }
}

async function generateStructuredResponse(prompt, language = 'en') {
  try {
    const langInstruction = languageInstructions[language] || languageInstructions.en;
    const fullPrompt = `${langInstruction}

${prompt}

Respond with a valid JSON object. Do not include any text outside the JSON.`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let text = response.text();

    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      text = jsonMatch[1].trim();
    }

    // Try to parse as JSON
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error('JSON Parse Error:', text);
      throw new Error('Failed to parse AI response as JSON');
    }
  } catch (error) {
    console.error('AI Structured Response Error:', error);
    throw error;
  }
}

async function detectLanguage(text) {
  try {
    const prompt = `Detect the language of the following text. Respond with only the ISO 639-1 or ISO 639-2 language code (e.g., 'en', 'hi', 'te', 'ta', 'kn', 'ml', 'mr', 'gu', 'pa', 'bn', 'ur', 'or', 'as', 'kok', 'ne', 'mni', 'sa'):

"${text}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const code = response.text().trim().toLowerCase();

    // Validate it's a known language
    const knownLanguages = Object.keys(languageInstructions);
    return knownLanguages.includes(code) ? code : 'en';
  } catch {
    return 'en';
  }
}

module.exports = {
  generateContent,
  generateStructuredResponse,
  detectLanguage,
  languageInstructions,
  supportedLanguages
};
