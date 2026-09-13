const supported = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  ml: 'Malayalam',
  kn: 'Kannada',
  bn: 'Bengali',
  mr: 'Marathi',
  gu: 'Gujarati',
  pa: 'Punjabi',
  ur: 'Urdu',
  es: 'Spanish',
  fr: 'French',
  ar: 'Arabic'
};

function detectLanguage(text) {
  if (!text || !text.trim()) return 'en';
  const s = text.trim().toLowerCase();

  // very lightweight heuristic: prioritize Indian language markers and common non-English scripts
  if (/[\u0900-\u097F]/.test(s)) return 'hi';
  if (/[\u0B80-\u0BFF]/.test(s)) return 'ta';
  if (/[\u0C00-\u0C7F]/.test(s)) return 'te';
  if (/[\u0D00-\u0D7F]/.test(s)) return 'ml';
  if (/[\u0C80-\u0CFF]/.test(s)) return 'kn';
  if (/[\u0980-\u09FF]/.test(s)) return 'bn';
  if (/[\u0900-\u097F]/.test(s) && /\b(ki|ka|ko|se|hai|hai|kya|samajh|vyavhar|nyay)\b/.test(s)) return 'hi';
  if (/[\u0A80-\u0AFF]/.test(s)) return 'pa';
  if (/[\u0600-\u06FF]/.test(s)) return 'ur';
  if (/(\bse\b|\btu\b|\bpor\b|\bpara\b|\bque\b|\bcomo\b|\bcomo\b)/.test(s)) return 'es';
  if (/(\bbonjour\b|\bmerci\b|\bfrance\b|\bcomment\b|\bque\b)/.test(s)) return 'fr';
  if (/(\bmarhba\b|\bharah\b|\bshukriya\b|\bnamaste\b)/.test(s)) return 'ur';
  return 'en';
}

function getSupportedLanguages() {
  return Object.entries(supported).map(([code, label]) => ({ code, label }));
}

function isSupportedLanguage(code) {
  return !!supported[code];
}

module.exports = { detectLanguage, getSupportedLanguages, isSupportedLanguage };
