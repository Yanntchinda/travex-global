// Données de démonstration — servent tant que Supabase n'est pas branché.
// Les mêmes objets sont renvoyés par l'API réelle une fois connectée.

export const demoUser = {
  id: 'u_1',
  firstName: 'yann',
  lastName: 'Tchinda',
  email: 'yanntchinda813@gmail.com',
  initials: 'YT',
  verified: false,
  stats: { voyages: 0, demandes: 0, note: 0 },
};

export const CITIES = {
  Douala: { flag: '🇨🇲', name: 'Douala' },
  Geneve: { flag: '🇨🇭', name: 'Genève' },
  Paris: { flag: '🇫🇷', name: 'Paris' },
  Yaounde: { flag: '🇨🇲', name: 'Yaoundé' },
  Bruxelles: { flag: '🇧🇪', name: 'Bruxelles' },
  Montreal: { flag: '🇨🇦', name: 'Montréal' },
  Londres: { flag: '🇬🇧', name: 'Londres' },
};

export const mockTrips = [
  {
    id: 't1',
    isNew: true,
    from: 'Douala',
    to: 'Genève',
    fromDate: '06.09.2026',
    toDate: '07.09.2026',
    transport: 'Avion',
    departLabel: 'Départ dans 7 jours',
    traveler: {
      name: 'Julien',
      lastName: 'N.',
      initials: 'JN',
      badge: 'Voyageur',
      rating: 5,
      reviews: 5,
      verified: true,
    },
    services: [
      { icon: 'document', title: 'Documents', price: '10 €/article', extra: 'Article', count: null },
      { icon: 'package', title: 'Colis', price: '10 €/kg', extra: '(138kg)', count: '+1 article' },
    ],
  },
  {
    id: 't2',
    isNew: false,
    from: 'Douala',
    to: 'Paris',
    fromDate: '30.08.2026',
    toDate: '31.08.2026',
    transport: 'Avion',
    departLabel: 'Aujourd\u2019hui',
    traveler: {
      name: 'Marie',
      lastName: 'K.',
      initials: 'MK',
      badge: 'Voyageur',
      rating: 4.5,
      reviews: 12,
      verified: false,
    },
    services: [
      { icon: 'package', title: 'Colis', price: '8 €/kg', extra: '(90 kg)', count: null },
    ],
  },
];

// Détail enrichi d'un voyage (utilisé sur l'écran Détails du voyage)
export const tripDetail = {
  id: 't1',
  traveler: {
    name: 'Julien N.',
    initials: 'JN',
    badge: 'Voyageur',
    rating: 5,
    reviews: 5,
    verified: true,
  },
  route: { from: 'Douala', to: 'Genève', fromDate: '06.09.2026', toDate: '07.09.2026', transport: 'Avion' },
  info: [
    { icon: 'document', title: 'Documents', detail: '10 €/article (max 50)' },
    { icon: 'package', title: 'Colis', detail: '10 €/kg (138 kg)' },
    { icon: 'valise', title: 'Valise #1', detail: '150 €/valise - 138kg X 6' },
  ],
  prohibited: [
    'Objets dangereux', 'Armes', 'Explosifs', 'Produits chimiques', 'Matériaux inflammables',
  ],
  notice:
    'Effectuez tous les paiements et communications exclusivement via l\u2019application. Ne transférez jamais d\u2019argent directement à d\u2019autres personnes en dehors de l\u2019application pour garantir votre sécurité.',
};
