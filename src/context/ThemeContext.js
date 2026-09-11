// ---------------------------------------------------------------------------
// Contexte de thème : mode CLAIR / SOMBRE, persisté sur l'appareil.
// - Le réglage est stocké dans 'travex.theme' ('light' | 'dark').
// - Au changement : applyTheme() bascule la palette (et réécrit les styles
//   enregistrés), puis `remountKey` change pour re-monter toute la
//   navigation et appliquer le nouveau thème partout, immédiatement.
// ---------------------------------------------------------------------------
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { applyTheme } from '../theme/theme';
import { localStore } from '../services/supabase';

// Sur web, le cadre « téléphone » (#root) a un fond blanc défini dans
// index.js : on le synchronise avec le thème pour éviter tout bord blanc
// en mode sombre (bords, rebonds de défilement, transitions).
function syncRootBackground(mode) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const root = document.getElementById('root');
  if (root) root.style.setProperty('background', mode === 'dark' ? '#0B1220' : '#FFFFFF', 'important');
}

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
      const m = saved === 'dark' ? 'dark' : 'light';
      applyTheme(m);
      syncRootBackground(m);
      setModeState(m);
    })();
    return () => { alive = false; };
  }, []);

  const setMode = (next) => {
    const m = next === 'dark' ? 'dark' : 'light';
    localStore.set(KEY_THEME, m);
    applyTheme(m);
    syncRootBackground(m);
    setModeState(m); // nouvelle valeur de contexte → tout l'arbre se re-rend
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
