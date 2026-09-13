import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { languageService, type Language } from '../services/languageService';

interface LanguageContextValue {
  languages: Language[];
  currentLanguage: string;
  setCurrentLanguage: (code: string) => void;
  voiceLocale: string;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be inside LanguageProvider');
  return ctx;
}

const STORAGE_KEY = 'legalai_language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [currentLanguage, setCurrentLanguageState] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) || 'en'
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadLanguages = async () => {
      const langs = await languageService.getLanguages();
      if (mounted) {
        setLanguages(langs);
        setLoading(false);
      }
    };

    loadLanguages();

    return () => {
      mounted = false;
    };
  }, []);

  const setCurrentLanguage = useCallback((code: string) => {
    setCurrentLanguageState(code);
    localStorage.setItem(STORAGE_KEY, code);
  }, []);

  const voiceLocale = languageService.getVoiceLocale(currentLanguage);

  return (
    <LanguageContext.Provider
      value={{ languages, currentLanguage, setCurrentLanguage, voiceLocale, loading }}
    >
      {children}
    </LanguageContext.Provider>
  );
}
