// ---------------------------------------------------------------------------
// Contexte de thème : mode CLAIR / SOMBRE, persisté sur l'appareil.
// - Le réglage est stocké dans 'travex.theme' ('light' | 'dark').
// - Au changement : applyTheme() bascule la palette (et réécrit les styles
//   enregistrés), puis `remountKey` change pour re-monter toute la
//   navigation et appliquer le nouveau thème partout, immédiatement.
// ---------------------------------------------------------------------------
import React, { createContext, useContext, useEffect, useState } from 'react';
import { applyTheme } from '../theme/theme';
import { localStore } from '../services/supabase';

const KEY_THEME = 'travex.theme';
const ThemeContext = createContext({ mode: 'light', setMode: () => {}, remountKey: 0 });

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(null); // null = réglage pas encore chargé
  const [remountKey, setRemountKey] = useState(0);

  // Charge le réglage au démarrage (avant le premier rendu de l'app).
  useEffect(() => {
    let alive = true;
    (async () => {
      const saved = await localStore.get(KEY_THEME, 'light');
      if (!alive) return;
      applyTheme(saved === 'dark' ? 'dark' : 'light');
      setModeState(saved === 'dark' ? 'dark' : 'light');
    })();
    return () => { alive = false; };
  }, []);

  const setMode = (next) => {
    const m = next === 'dark' ? 'dark' : 'light';
    localStore.set(KEY_THEME, m);
    applyTheme(m);
    setModeState(m);
    setRemountKey((k) => k + 1); // force le re-rendu complet
  };

  // Tant que le réglage n'est pas chargé, on ne rend rien (évite un flash
  // de thème clair au démarrage pour les utilisateurs en mode sombre).
  if (mode === null) return null;

  return (
    <ThemeContext.Provider value={{ mode, setMode, remountKey }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
