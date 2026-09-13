import { apiClient } from './apiClient';

export interface Language {
  code: string;
  label: string;
  voiceLocale: string;
}

const FALLBACK_LANGUAGES: Language[] = [
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
  { code: 'sa', label: 'Sanskrit', voiceLocale: 'sa-IN' },
];

let cachedLanguages: Language[] | null = null;

export const languageService = {
  async getLanguages(): Promise<Language[]> {
    if (cachedLanguages) return cachedLanguages;

    try {
      const response = await apiClient.get<{ languages: Language[] }>('/languages');
      cachedLanguages = response.languages;
      return cachedLanguages;
    } catch {
      cachedLanguages = FALLBACK_LANGUAGES;
      return cachedLanguages;
    }
  },

  getVoiceLocale(code: string): string {
    const lang = FALLBACK_LANGUAGES.find((l) => l.code === code);
    return lang?.voiceLocale || 'en-IN';
  },

  getLabel(code: string): string {
    const lang = FALLBACK_LANGUAGES.find((l) => l.code === code);
    return lang?.label || 'English';
  },
};
