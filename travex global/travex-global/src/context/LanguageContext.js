import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../i18n/translations';

const LanguageContext = createContext(null);
const KEY = 'travex.lang';

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('fr');
  const [chosen, setChosen] = useState(false); // l'utilisateur a-t-il choisi la langue ?

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(KEY);
      if (saved) { setLang(saved); setChosen(true); }
    })();
  }, []);

  const chooseLang = async (l) => {
    setLang(l);
    setChosen(true);
    await AsyncStorage.setItem(KEY, l);
  };

  const t = (key) => (translations[lang] && translations[lang][key]) || translations.fr[key] || key;

  return (
    <LanguageContext.Provider value={{ lang, chosen, chooseLang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage doit être utilisé dans LanguageProvider');
  return ctx;
}
