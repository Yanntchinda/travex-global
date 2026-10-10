// Règles d'accès centralisées. Modifier src/config.js pour (dé)activer.
import { FEATURES, DEPARTURE_PUBLISHERS } from '../config';

// Un compte peut-il publier ce type d'annonce ? type : 'voyage' | 'demande'
export function canPublish(user, type = 'voyage') {
  if (!user) return false;
  if (type !== 'voyage') return true;            // demandes : ouvertes à tous les comptes
  if (!FEATURES.RESTRICT_DEPARTURES) return true;
  if (user.role === 'admin') return true;
  return DEPARTURE_PUBLISHERS.includes(String(user.email || '').toLowerCase());
}

// La CNI / selfie sont-elles demandées à l'inscription ?
export function requiresIdVerification() {
  return !!FEATURES.REQUIRE_ID_VERIFICATION;
}
