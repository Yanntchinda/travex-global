// ---------------------------------------------------------------------------
// Moyens de paiement TRAVEX GLOBAL (phase 1 : comptabilité virtuelle).
//
// L'utilisateur enregistre les RÉFÉRENCES de ses comptes (numéro Mobile
// Money, email PayPal, carte bancaire) pour que ses correspondants sachent
// comment le payer. Un utilisateur peut enregistrer UN ou PLUSIEURS modes.
//
// Phase 1 : les références sont stockées localement (simulation), aucun
// paiement réel. Phase 2 : validation des comptes via un serveur sécurisé +
// passerelles réelles (Orange Money, MTN MoMo, PayPal, carte).
// ---------------------------------------------------------------------------

// Métadonnées d'affichage des 4 modes proposés.
export const PAYMENT_MODES = {
  orange: {
    label: 'Orange Money',
    icon: 'phone-portrait-outline',
    color: '#FF7900',
    text: '#FFFFFF',
    // Champs du formulaire d'ajout
    fields: [
      { key: 'ref', label: 'Numéro Orange Money', placeholder: '+237 6XX XX XX XX', keyboard: 'phone-pad' },
      { key: 'name', label: 'Nom du compte', placeholder: 'Ex. : Jean Dupont', keyboard: 'default' },
    ],
  },
  mtn: {
    label: 'MTN MoMo',
    icon: 'cash-outline',
    color: '#FFCC00',
    text: '#111827',
    fields: [
      { key: 'ref', label: 'Numéro MTN MoMo', placeholder: '+237 6XX XX XX XX', keyboard: 'phone-pad' },
      { key: 'name', label: 'Nom du compte', placeholder: 'Ex. : Jean Dupont', keyboard: 'default' },
    ],
  },
  paypal: {
    label: 'PayPal',
    icon: 'at-outline',
    color: '#003087',
    text: '#FFFFFF',
    fields: [
      { key: 'ref', label: 'Email PayPal', placeholder: 'vous@exemple.com', keyboard: 'email-address' },
      { key: 'name', label: 'Nom du compte', placeholder: 'Ex. : Jean Dupont', keyboard: 'default' },
    ],
  },
  card: {
    label: 'Carte bancaire',
    icon: 'card-outline',
    color: '#334155',
    text: '#FFFFFF',
    fields: [
      { key: 'ref', label: 'Numéro de carte', placeholder: '4111 1111 1111 1111', keyboard: 'numeric' },
      { key: 'name', label: 'Titulaire de la carte', placeholder: 'Ex. : JEAN DUPONT', keyboard: 'default' },
      { key: 'extra', label: 'Expiration (MM/AA)', placeholder: '09/28', keyboard: 'numeric' },
    ],
  },
};

// Référence masquée pour l'affichage (carte : seuls les 4 derniers chiffres).
export function maskPaymentRef(type, ref) {
  const s = String(ref || '');
  if (type === 'card') {
    const digits = s.replace(/\D/g, '');
    return digits.length >= 4 ? '•••• ' + digits.slice(-4) : s;
  }
  return s;
}

// Modes de paiement des voyageurs de DÉMONSTRATION (annonces mock).
// En phase 1, chaque voyageur simulé accepte certains modes ; les annonces
// publiées par l'UTILISATEUR affichent ses propres modes enregistrés.
export function getDemoTravelerMethods(travelerName) {
  const n = String(travelerName || '').toLowerCase();
  const byName = [
    {
      match: /julien/,
      methods: [
        { type: 'orange', ref: '+237 690 12 34 56', name: 'Julien N.' },
        { type: 'paypal', ref: 'julien.n@travex.app', name: 'Julien N.' },
      ],
    },
    {
      match: /marie/,
      methods: [
        { type: 'mtn', ref: '+237 655 98 76 54', name: 'Marie D.' },
        { type: 'card', ref: '4111 1111 1111 1111', name: 'Marie D.' },
      ],
    },
    {
      match: /aïcha|aicha/,
      methods: [
        { type: 'orange', ref: '+237 677 45 23 89', name: 'Aïcha K.' },
        { type: 'mtn', ref: '+237 678 90 12 34', name: 'Aïcha K.' },
      ],
    },
    {
      match: /sophie/,
      methods: [
        { type: 'paypal', ref: 'sophie.m@travex.app', name: 'Sophie M.' },
        { type: 'card', ref: '5500 0000 0000 0004', name: 'Sophie M.' },
      ],
    },
    {
      match: /erick/,
      methods: [
        { type: 'mtn', ref: '+237 683 20 45 67', name: 'Erick T.' },
      ],
    },
  ];
  const found = byName.find((x) => x.match.test(n));
  if (found) return found.methods;
  // Par défaut : Orange Money (mode le plus courant en zone CEMAC).
  return [{ type: 'orange', ref: '+237 6XX XX XX XX', name: travelerName || 'Voyageur' }];
}
