// ============================================================
//  CONFIGURATION TRAVEX GLOBAL
// ============================================================

export const APP = {
  name: 'TRAVEX GLOBAL',
  version: '2.0.0',
};

// Devise affichée pour les tarifs
export const CURRENCY = '€';

// Espace administrateur : c'est vous qui publiez les départs
// et gérez les réservations. Seul ce compte peut accéder à l'espace admin.
export const OWNER = {
  email: 'admin@travexglobal.com',
  password: 'Admin123!',
};

// Modes de transport proposés pour un départ
export const TRANSPORTS = ['Avion', 'Cargo', 'RO-RO'];
