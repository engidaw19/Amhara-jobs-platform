import { createContext, useContext, useEffect, useState } from 'react';

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('ajp_lang') || 'en');

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l) => {
    if (!['en', 'am'].includes(l)) return;
    setLangState(l);
    localStorage.setItem('ajp_lang', l);
  };

  const t = (en, am) => {
    if (lang === 'am' && am) return am;
    return en;
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}
