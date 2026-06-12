import { createContext, useContext, useState } from 'react';
import { translations } from './translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(
    () => localStorage.getItem('umuhoza_lang') || 'en'
  );

  const setLang = (code) => {
    setLangState(code);
    localStorage.setItem('umuhoza_lang', code);
  };

  // Supports dot-notation keys like 'nav.home' or 'home.why.defaultItems'.
  // Returns arrays untouched so callers can map over them.
  const t = (key) => {
    const keys = key.split('.');
    const value = keys.reduce((obj, k) => obj?.[k], translations[lang]);
    if (value !== undefined) return value;
    // Fallback to English when key is missing in selected language.
    const fallback = keys.reduce((obj, k) => obj?.[k], translations.en);
    return fallback !== undefined ? fallback : key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}
