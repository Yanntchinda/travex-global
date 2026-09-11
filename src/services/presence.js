// ---------------------------------------------------------------------------
// Présence « En ligne / Hors ligne » (mode démo).
//
// ⚠️ ARCHITECTURE PHASE 1 (production) : ce module sera branché sur le serveur
// WebSocket du backend au lieu de la simulation :
//   - connexion : le serveur sait qui est connecté (socket ouverte) ;
//   - le serveur diffuse les événements presence:online / presence:offline ;
//   - subscribePresence(fn) recevra alors les VRAIS statuts, sans changer
//     une ligne dans les écrans (même API).
// En démo (aujourd'hui) : les statuts sont simulés localement — un tirage
// stable par identifiant + des bascules aléatoires périodiques, afin que
// l'interface réagisse « en temps réel » pendant les tests.
// ---------------------------------------------------------------------------

const states = {};       // id -> boolean (true = en ligne)
const listeners = new Set();
let timer = null;

// Tirage stable : un même identifiant garde toujours le même statut initial
// (tant qu'aucune bascule aléatoire ne l'a changé).
function seedPresence(id) {
  if (id in states) return states[id];
  let h = 0;
  const s = String(id || '');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  states[id] = h % 3 !== 0; // ~2 connectés sur 3
  return states[id];
}

function emit(id, online) {
  listeners.forEach((fn) => { try { fn({ id, online }); } catch (e) {} });
}

// Bascules aléatoires toutes les 12 s : rend la présence « vivante » en démo.
function ensureTimer() {
  if (timer) return;
  timer = setInterval(() => {
    const ids = Object.keys(states);
    if (!ids.length) return;
    const id = ids[Math.floor(Math.random() * ids.length)];
    states[id] = !states[id];
    emit(id, states[id]);
  }, 12000);
  // Ne bloque jamais la fermeture de l'app en Node/test.
  if (typeof timer.unref === 'function') timer.unref();
}

// Statut actuel (synchrone, avec seed au premier appel).
export function isOnline(id) {
  const v = seedPresence(id);
  ensureTimer();
  return v;
}

// S'abonne aux changements de présence. Retourne la fonction de désabonnement.
export function subscribePresence(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Force un statut (utilisé par les tests ou un futur backend WebSocket).
export function setPresence(id, online) {
  states[id] = !!online;
  emit(id, states[id]);
}
