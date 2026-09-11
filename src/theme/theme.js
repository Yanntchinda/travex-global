// Palette TRAVEX GLOBAL — palet identitaire propre (différenciée de Treliko)
// On garde un bleu marine (couleur du logo TRAVEX) mais on ajoute des accents
// teal/orange et on retravaille les tons pour une identité bien distincte.
// NOTE : `card` vaut #FEFEFE (et non #FFFFFF) pour rester distinguable de
// `white` lors des permutations clair <-> sombre (cf. applyTheme ci-dessous).
export const lightColors = {
  primary: '#0043E0',      // bleu signature TRAVEX (#0043E0)
  primaryDark: '#0035B8',  // bleu foncé (en-têtes)
  primaryLight: '#E8EDFB', // bleu très clair (fonds, hover)
  accent: '#0E8F83',       // TEAL — accent signature TRAVEX
  accentLight: '#E2F3F1',  // teal très clair
  orange: '#E8833A',       // accent orangé (badges)
  green: '#1F9D63',        // vert (statuts positifs)
  red: '#D64545',          // rouge (interdits, déconnexion)
  bg: '#EEF1F5',           // fond de l'app
  card: '#FEFEFE',         // fond des cartes (#FEFEFE : distinct de white pour le thème)
  text: '#20303F',         // texte principal
  muted: '#6B7787',        // texte secondaire
  border: '#E3E8EE',       // bordures
  inputBg: '#F2F5F8',      // fond des champs
  star: '#F5A623',
  white: '#FFFFFF',
};

// Palette sombre « nuit » — mêmes clés, valeurs adaptées aux fonds foncés.
export const darkColors = {
  ...lightColors,
  primaryLight: '#1D2B4D', // bleu très clair -> bleu nuit
  accentLight: '#123733',  // teal clair -> teal nuit
  bg: '#0B1220',           // fond de l'app
  card: '#151F35',         // fond des cartes (≠ white : doit rester unique)
  text: '#E2E8F0',         // texte principal
  muted: '#94A3B8',        // texte secondaire
  border: '#26334D',       // bordures
  inputBg: '#1B2740',      // fond des champs
};

// Palette ACTIVE de l'app — objet mutable : applyTheme() la remplace et
// met à jour les feuilles de style déjà créées (cf. theme/sheetPatch).
export const colors = { ...lightColors };

// Applique un mode ('light' | 'dark') : bascule `colors` ET réécrit à la
// volée les couleurs des StyleSheet déjà enregistrés, puis l'app est
// re-montée (clé de remount dans ThemeContext) pour tout re-rendre.
export function applyTheme(mode) {
  const next = mode === 'dark' ? darkColors : lightColors;
  const prev = { ...colors };
  Object.assign(colors, next);
  // Map bidirectionelle ancienne valeur -> nouvelle valeur (uniquement les
  // clés qui diffèrent entre les deux palettes).
  const map = {};
  for (const k of Object.keys(next)) {
    if (prev[k] !== next[k]) map[prev[k]] = next[k];
  }
  // Lazy import pour éviter une dépendance circulaire au chargement.
  const { swapSheets } = require('./sheetPatch');
  swapSheets(map);
  return mode;
}

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28,
};

export const radius = { sm: 12, md: 16, lg: 20, xl: 28 };

export const shadow = {
  card: {
    shadowColor: '#0B2545',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
};

// Icônes + libellés des modes de transport
export const TRANSPORT_MODES = [
  { key: 'Avion', icon: 'airplane', color: '#0043E0' },
  { key: 'Cargo', icon: 'boat', color: '#0E8F83' },
  { key: 'Terrestre', icon: 'bus', color: '#E8833A' },
];
