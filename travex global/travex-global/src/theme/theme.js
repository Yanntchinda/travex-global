// Palette TRAVEX GLOBAL — palet identitaire propre (différenciée de Treliko)
// On garde un bleu marine (couleur du logo TRAVEX) mais on ajoute des accents
// teal/orange et on retravaille les tons pour une identité bien distincte.
export const colors = {
  primary: '#1B4F8A',      // bleu marine (logo TRAVEX)
  primaryDark: '#123A69',  // bleu foncé (en-têtes)
  primaryLight: '#E7EEF7', // bleu très clair (fonds, hover)
  accent: '#0E8F83',       // TEAL — accent signature TRAVEX
  accentLight: '#E2F3F1',  // teal très clair
  orange: '#E8833A',       // accent orangé (badges)
  green: '#1F9D63',        // vert (statuts positifs)
  red: '#D64545',          // rouge (interdits, déconnexion)
  bg: '#EEF1F5',           // fond de l'app
  card: '#FFFFFF',         // fond des cartes
  text: '#20303F',         // texte principal
  muted: '#6B7787',        // texte secondaire
  border: '#E3E8EE',       // bordures
  inputBg: '#F2F5F8',      // fond des champs
  star: '#F5A623',
  white: '#FFFFFF',
};

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
  { key: 'Avion', icon: 'airplane', color: '#1B4F8A' },
  { key: 'Cargo', icon: 'boat', color: '#0E8F83' },
  { key: 'Terrestre', icon: 'bus', color: '#E8833A' },
];
