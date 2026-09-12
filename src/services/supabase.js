// Service de stockage & authentification.
// Mode DÉMO (local, AsyncStorage) par défaut. Mode CLOUD (Supabase) si config renseignée.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockTrips, tripDetail } from '../data/mockData';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

const CLOUD_ENABLED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
let supabase = null;
if (CLOUD_ENABLED) {
  const { createClient } = require('@supabase/supabase-js');
  require('react-native-url-polyfill/auto');
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

const KEY_SESSION = 'travex.session';
const KEY_USER = 'travex.user';
const KEY_USERS = 'travex.users'; // profils enregistrés (à vérifier côté admin)
const KEY_ANNOUNCE = 'travex.annonces'; // annonces publiées (attente / validées / rejetées)
const KEY_RESERVATIONS = 'travex.reservations'; // liste de réservations (kg, total, statut)
const KEY_RATINGS = 'travex.ratings'; // { targetId: [{score, at}] }
const KEY_NOTIFS = 'travex.notifications'; // notifications in-app
const KEY_PROPOSALS = 'travex.proposals'; // propositions de voyageurs sur une demande
const KEY_SHIPMENTS = 'travex.shipments'; // colis à suivre (expéditeur / voyageur)
const KEY_CONVERSATIONS = 'travex.conversations'; // conversations de messagerie
const KEY_REPORTS = 'travex.reports'; // signalements d'utilisateurs (preuves + raison)
const KEY_FAVORITES = 'travex.favoris'; // voyages mis en favori (affichés en premier à l'accueil)

// ============ COMPTES PRÉCONFIGURÉS (admin + compte vérifié) ============
// Accès de test fournis à l'utilisateur.
export const ADMIN_CREDENTIALS = { email: 'admin@travexglobal.com', password: 'Admin123!' };
export const VERIFIED_CREDENTIALS = { email: 'demo@travexglobal.com', password: 'Demo1234!' };

export const localStore = {
  async get(key, fallback = null) {
    try { const raw = await AsyncStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
  },
  async set(key, value) { try { await AsyncStorage.setItem(key, JSON.stringify(value)); } catch {} },
  async remove(key) { try { await AsyncStorage.removeItem(key); } catch {} },
};

function buildUser(p) {
  return {
    id: (p.email || 'u_') + '_' + Date.now(),
    firstName: p.firstName || '',
    lastName: p.lastName || '',
    email: p.email || '',
    phone: p.phone || '',
    location: p.location || '',
    avatar: p.avatar || null,
    cniPhoto: p.cniPhoto || null,
    cniSelfie: p.cniSelfie || null,
    initials: ((p.firstName || 'X')[0] + (p.lastName || 'X')[0]).toUpperCase(),
    verified: false,
    verificationPending: true,
    role: 'user',
    stats: { voyages: 0, demandes: 0, note: 0 },
  };
}

// ---------- Inscription complète (références + CNI + avatar) ----------
// Stocke aussi le profil dans la liste des profils à vérifier (côté admin).
export async function registerUser(d) {
  if (!d.email || !d.password) throw new Error('E-mail et mot de passe requis.');
  const base = buildUser({
    firstName: d.firstName, lastName: d.lastName, email: d.email,
    phone: d.phone, location: d.location, cniPhoto: d.cniPhoto, cniSelfie: d.cniSelfie, avatar: d.avatar,
  });
  const users = await localStore.get(KEY_USERS, []);
  users.push(base);
  await localStore.set(KEY_USERS, users);
  await localStore.set(KEY_SESSION, 'active');
  await localStore.set(KEY_USER, base);
  return base;
}

// ---------- Authentification (compte vérifié + admin préconfigurés) ----------
export async function signIn({ email, password }) {
  if (!email || !password) throw new Error('E-mail et mot de passe requis.');

  // Compte administrateur
  if (email.toLowerCase() === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
    const admin = {
      id: 'admin_1', firstName: 'Admin', lastName: 'TRAVEX', email, initials: 'AT',
      avatar: null, verified: true, verificationPending: false, role: 'admin',
      stats: { voyages: 0, demandes: 0, note: 0 },
    };
    await localStore.set(KEY_USER, admin);
    await localStore.set(KEY_SESSION, 'active');
    return { user: admin };
  }
  // Compte vérifié (démo)
  if (email.toLowerCase() === VERIFIED_CREDENTIALS.email && password === VERIFIED_CREDENTIALS.password) {
    const u = {
      id: 'verified_1', firstName: 'Jean', lastName: 'Dupont (vérifié)', email, initials: 'JD',
      avatar: null, verified: true, verificationPending: false, role: 'user',
      stats: { voyages: 1, demandes: 0, note: 5 },
    };
    await localStore.set(KEY_USER, u);
    await localStore.set(KEY_SESSION, 'active');
    return { user: u };
  }
  // Compte créé manuellement (registre)
  const users = await localStore.get(KEY_USERS, []);
  const found = users.find((u) => u.email === email);
  if (found) {
    const user = found;
    await localStore.set(KEY_USER, user);
    await localStore.set(KEY_SESSION, 'active');
    return { user };
  }
  throw new Error('Compte introuvable. Créez un compte.');
}

export async function getSessionUser() {
  const session = await localStore.get(KEY_SESSION);
  if (!session) return null;
  return await localStore.get(KEY_USER);
}

export async function signOut() {
  if (CLOUD_ENABLED) await supabase.auth.signOut();
  await localStore.remove(KEY_SESSION);
  await localStore.remove(KEY_USER);
}

// Mise à jour du profil (avatar, références)
export async function updateUser(patch) {
  const cur = (await localStore.get(KEY_USER)) || {};
  const next = { ...cur, ...patch };
  await localStore.set(KEY_USER, next);
  return next;
}

// ---------- Notes / avis (système de score par plusieurs personnes) ----------
// Pré-remplit quelques avis divers pour que le score moyen ne soit jamais toujours 5.
async function ensureRatingsSeeded() {
  let ratings = await localStore.get(KEY_RATINGS, null);
  if (ratings) return ratings;
  ratings = {
    trav_jn: [5, 4, 5, 3, 5, 2],
    trav_mk: [4, 3, 5, 4, 4, 5],
    trav_ad: [5, 5, 4, 5, 3, 5, 4, 4],
    trav_client: [5],
  };
  await localStore.set(KEY_RATINGS, ratings);
  return ratings;
}

// Retourne la moyenne et le nombre d'avis pour une cible.
export async function getRatings(targetId) {
  await ensureRatingsSeeded();
  const ratings = await localStore.get(KEY_RATINGS, {});
  const list = ratings[targetId] || [];
  const count = list.length;
  // Les avis seedés sont des nombres, les nouveaux sont des objets {score, at}.
  const average = count
    ? list.reduce((s, r) => s + (typeof r === 'number' ? r : Number(r.score) || 0), 0) / count
    : 0;
  return { average: Math.round(average * 10) / 10, count, ratings: list };
}

// Ajoute une note (1-5) pour une cible et recalcule la moyenne.
export async function rateTarget(targetId, score) {
  const ratings = await localStore.get(KEY_RATINGS, {});
  const list = ratings[targetId] || [];
  list.push({ score: Number(score), at: Date.now() });
  ratings[targetId] = list;
  await localStore.set(KEY_RATINGS, ratings);
  return getRatings(targetId);
}

// ---------- Annonces ----------
async function getCapacity(id) {
  const published = await localStore.get(KEY_ANNOUNCE, []);
  const found = published.find((a) => a.id === id);
  if (found) return Number(found.weight ?? found.capacityKg) || 0;
  const all = [...mockTrips];
  const m = all.find((a) => a.id === id);
  return Number(m && (m.capacityKg ?? m.weight)) || 0;
}

export async function getReservations() {
  return await localStore.get(KEY_RESERVATIONS, []);
}

async function activeBookedKg(id) {
  const res = await localStore.get(KEY_RESERVATIONS, []);
  return res.filter((r) => r.tripId === id && r.status === 'active').reduce((s, r) => s + Number(r.kg), 0);
}

// ---------- Favoris ----------
// Liste des identifiants de voyages favoris (localement, mode démo).
export async function getFavoriteIds() {
  return (await localStore.get(KEY_FAVORITES, [])) || [];
}

// Ajoute/retire un voyage des favoris. Retourne la nouvelle liste d'identifiants.
export async function toggleFavorite(id) {
  const list = (await localStore.get(KEY_FAVORITES, [])) || [];
  const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  await localStore.set(KEY_FAVORITES, next);
  return next;
}

export async function fetchTrips() {
  const published = await localStore.get(KEY_ANNOUNCE, []);
  const all = [...published, ...mockTrips];
  const bookings = await localStore.get(KEY_RESERVATIONS, []);
  const seeded = await ensureRatingsSeeded();
  const out = [];
  for (const a of all) {
    // Annonce masquée par son propriétaire : invisible sur l'accueil et dans les recherches.
    if (a.hidden) continue;
    const capacity = Number(a.capacityKg ?? a.weight) || 0;
    const booked = bookings.filter((r) => r.tripId === a.id && r.status === 'active').reduce((s, r) => s + Number(r.kg), 0);
    // Note moyenne du transporteur
    const targetId = a.travelerId || a.id;
    const score = await getRatings(targetId);
    // Profil transporteur : celui de l'annonce (démo) ou construit depuis l'utilisateur qui a publié.
    const fallbackName = a.userName || 'Voyageur';
    const init = (a.traveler && a.traveler.initials) || fallbackName
      .split(/[\s.]+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || 'TR';
    const traveler = a.traveler
      ? { ...a.traveler, rating: score.average, reviews: score.count }
      : {
          name: fallbackName,
          initials: init,
          verified: !!a.travelerVerified,
          rating: score.average,
          reviews: score.count,
        };
    // Champs propres aux demandes d'expédition (profil expéditeur, poids, budget, échéance).
    const sender = a.sender || {
      name: a.userName || 'Expéditeur',
      avatar: null,
      verified: !!a.travelerVerified,
      rating: score.average,
      dealsCount: score.count,
    };
    const primaryCat = a.category || (Array.isArray(a.categories) && a.categories[0]) || 'document';
    out.push({
      ...a,
      fromDate: a.fromDate || a.date,
      toDate: a.toDate || a.date,
      pricePerKg: Number(a.pricePerKg ?? a.price) || 0,
      capacityKg: capacity,
      bookedKg: booked,
      remainingKg: Math.max(0, capacity - booked),
      traveler,
      // Normalisation demande
      title: a.title || '',
      deadline: a.deadline || a.fromDate || a.date || '',
      urgency: a.urgency === 'urgent' ? 'urgent' : 'flexible',
      category: primaryCat,
      weightNeeded: Number(a.weightNeeded ?? a.weight ?? a.capacityKg) || 0,
      budgetPerKg: Number(a.budgetPerKg ?? a.pricePerKg ?? a.price) || 0,
      parcelImage: a.parcelImage || null,
      sender,
    });
  }
  return out;
}

export async function fetchTripDetail(id) {
  const published = await localStore.get(KEY_ANNOUNCE, []);
  let detail = published.find((a) => a.id === id);
  if (!detail) detail = mockTrips.find((a) => a.id === id);
  if (!detail) detail = tripDetail;
  const isDemande = !!detail.isDemande;
  const booked = await activeBookedKg(id);
  const capacity = Number(detail.capacityKg ?? detail.weight ?? detail.weightNeeded) || 0;
  const pricePerKg = Number(detail.pricePerKg ?? detail.price ?? detail.budgetPerKg) || 0;
  const targetId = detail.travelerId || id;
  const score = await getRatings(targetId);
  const fallbackName = detail.userName || 'Voyageur';
  const init = (detail.traveler && detail.traveler.initials) || fallbackName
    .split(/[\s.]+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || 'TR';
  const traveler = detail.traveler
    ? { ...detail.traveler, rating: score.average, reviews: score.count }
    : {
        name: fallbackName,
        initials: init,
        verified: !!detail.travelerVerified,
        rating: score.average,
        reviews: score.count,
      };
  const sender = detail.sender || {
    name: fallbackName,
    avatar: null,
    verified: !!detail.travelerVerified,
    rating: score.average,
    dealsCount: score.count,
  };
  const primaryCat = detail.category || (Array.isArray(detail.categories) && detail.categories[0]) || 'document';
  return {
    ...detail,
    fromDate: detail.fromDate || detail.date,
    toDate: detail.toDate || detail.date,
    capacityKg: capacity,
    bookedKg: booked,
    remainingKg: Math.max(0, capacity - booked),
    pricePerKg,
    traveler,
    // Normalisation demande
    isDemande,
    title: detail.title || '',
    deadline: detail.deadline || detail.fromDate || detail.date || '',
    urgency: detail.urgency === 'urgent' ? 'urgent' : 'flexible',
    category: primaryCat,
    weightNeeded: Number(detail.weightNeeded ?? detail.weight ?? detail.capacityKg) || 0,
    budgetPerKg: Number(detail.budgetPerKg ?? detail.pricePerKg ?? detail.price) || 0,
    parcelImage: detail.parcelImage || null,
    sender,
  };
}

// Création d'une annonce (persistée localement, statut attente pour les départs)
export async function createTrip(trip) {
  const list = await localStore.get(KEY_ANNOUNCE, []);
  const ann = { ...trip, id: 'a_' + Date.now(), createdAt: Date.now() };
  list.unshift(ann);
  await localStore.set(KEY_ANNOUNCE, list);
  // Notifie l'utilisateur que son annonce est publiée.
  await addNotification({
    type: 'publish',
    isDemande: !!trip.isDemande,
    from: trip.from,
    to: trip.to,
    detail: trip.transport ? trip.transport : `jusqu\u2019au ${trip.deadline || ''}`,
  });
  return ann;
}

// Annonces d'un utilisateur (par e-mail du compte connecté)
export async function fetchUserAnnouncements(email) {
  const published = await localStore.get(KEY_ANNOUNCE, []);
  return published.filter((a) => a.userEmail === email);
}

// Masque / réaffiche une de SES annonces (visible uniquement dans son profil).
// Une annonce masquée disparaît de l'accueil et des recherches pour tout le monde.
export async function setAnnouncementHidden(id, hidden) {
  const list = await localStore.get(KEY_ANNOUNCE, []);
  const next = list.map((a) => (a.id === id ? { ...a, hidden: !!hidden } : a));
  await localStore.set(KEY_ANNOUNCE, next);
  return next;
}

// ---------- Réservations (kg × tarif, annulable) ----------
// Crée une réservation en soustrayant de la capacité. Calcule le total = kg × tarif/kg.
export async function bookKg(id, kg, extra = {}) {
  const res = await localStore.get(KEY_RESERVATIONS, []);
  const already = res.filter((r) => r.tripId === id && r.status === 'active').reduce((s, r) => s + Number(r.kg), 0);
  const capacity = await getCapacity(id);
  const remaining = capacity - already - kg;
  if (remaining < 0) {
    throw new Error(`Capacité insuffisante. Il reste ${Math.max(0, capacity - already)} kg disponibles.`);
  }
  const pricePerKg = Number(extra.pricePerKg ?? 0);
  const reservation = {
    id: 'r_' + Date.now(),
    tripId: id,
    kg: Number(kg),
    pricePerKg,
    total: Number(kg) * pricePerKg,
    from: extra.from || '',
    to: extra.to || '',
    date: extra.date || '',
    transport: extra.transport || '',
    userName: extra.userName || '',
    status: 'active',
    createdAt: Date.now(),
  };
  res.unshift(reservation);
  await localStore.set(KEY_RESERVATIONS, res);
  // Notifie + crée aussi le suivi du colis côté expéditeur.
  await addNotification({
    type: 'booking',
    kg: Number(kg),
    from: reservation.from,
    to: reservation.to,
    total: reservation.total,
  });
  await createShipmentFromBooking({
    reservation,
    trip: { from: reservation.from, to: reservation.to, transport: reservation.transport, traveler: { name: reservation.userName } },
  });
  // Ouvre une conversation avec le voyageur.
  await ensureConversation({
    name: reservation.userName || 'Voyageur',
    last: `Réservation de ${kg} kg (${reservation.from} → ${reservation.to})`,
    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  });
  return { capacity, booked: already + kg, remaining, reservation };
}

export async function cancelReservation(reservationId) {
  const res = await localStore.get(KEY_RESERVATIONS, []);
  const next = res.map((r) => (r.id === reservationId ? { ...r, status: 'cancelled' } : r));
  await localStore.set(KEY_RESERVATIONS, next);
  return next;
}

// ---------- Administration ----------
export async function fetchAllAnnouncements() {
  const published = await localStore.get(KEY_ANNOUNCE, []);
  return published;
}

export async function setAnnouncementStatus(id, status) {
  const list = await localStore.get(KEY_ANNOUNCE, []);
  const target = list.find((a) => a.id === id);
  const next = list.map((a) => (a.id === id ? { ...a, status } : a));
  await localStore.set(KEY_ANNOUNCE, next);
  // Notifie l'auteur de l'annonce du changement de statut.
  await addNotification({
    type: 'status',
    status,
    from: target && target.from,
    to: target && target.to,
  });
  return next;
}

// Profils en attente de vérification (côté admin)
export async function fetchPendingUsers() {
  let users = await localStore.get(KEY_USERS, []);
  // Pré-remplit un profil de démo pour que l'admin ait de quoi vérifier.
  if (users.length === 0) {
    users = [
      {
        id: 'pending_1', firstName: 'Awa', lastName: 'Nkomo', email: 'awa@example.com',
        phone: '+237 6 77 00 00 00', location: 'Yaoundé', verified: false, verificationPending: true,
        initials: 'AN', role: 'user',
        cniPhoto: 'https://via.placeholder.com/300x180?text=CNI+Awa',
        cniSelfie: 'https://via.placeholder.com/300x180?text=Awa+CNI',
      },
      {
        id: 'pending_2', firstName: 'Boris', lastName: 'Talla', email: 'boris@example.com',
        phone: '+237 6 99 00 00 00', location: 'Douala', verified: false, verificationPending: true,
        initials: 'BT', role: 'user',
        cniPhoto: 'https://via.placeholder.com/300x180?text=CNI+Boris',
        cniSelfie: 'https://via.placeholder.com/300x180?text=Boris+CNI',
      },
    ];
    await localStore.set(KEY_USERS, users);
  }
  return users.filter((u) => u.verificationPending);
}

export async function verifyUser(id) {
  const users = await localStore.get(KEY_USERS, []);
  const next = users.map((u) => (u.id === id ? { ...u, verified: true, verificationPending: false } : u));
  await localStore.set(KEY_USERS, next);
  return next;
}

// ---------- Notifications in-app ----------
export async function getNotifications() {
  let list = await localStore.get(KEY_NOTIFS, null);
  if (list) return list;
  // Notifications de démonstration pré-remplies.
  list = [
    { id: 'n1', icon: 'checkmark-circle-outline', title_fr: 'Annonce validée', body_fr: 'Votre départ Douala → Genève a été confirmé par un administrateur.', title_en: 'Listing approved', body_en: 'Your departure Douala → Genève was confirmed by an admin.', time: '09:20', read: false },
    { id: 'n2', icon: 'chatbubble-outline', title_fr: 'Nouveau message', body_fr: 'Julien N. vous a envoyé un message.', title_en: 'New message', body_en: 'Julien N. sent you a message.', time: '09:18', read: false },
    { id: 'n3', icon: 'shield-checkmark-outline', title_fr: 'Compte vérifié', body_fr: 'Votre profil a été vérifié avec succès.', title_en: 'Account verified', body_en: 'Your profile was verified successfully.', time: '08:45', read: true },
  ];
  await localStore.set(KEY_NOTIFS, list);
  return list;
}

// Construit une notification normalisée (title_fr/en, body_fr/en, icon, time)
// à partir soit de champs explicites, soit d'un type + contexte.
function buildNotification(d, time) {
  const type = d.type || 'info';
  const icons = {
    proposal: 'chatbubble-ellipses', landing: 'airplane', shipment: 'archive',
    publish: 'megaphone', status: 'checkmark-circle', message: 'chatbubble',
    booking: 'cube', info: 'notifications',
  };
  const icon = d.icon || icons[type] || 'notifications';
  if (d.title_fr || d.title_en) {
    return {
      icon,
      title_fr: d.title_fr || d.title_en, title_en: d.title_en || d.title_fr,
      body_fr: d.body_fr || d.body_en, body_en: d.body_en || d.body_fr,
      time: d.time || time,
    };
  }
  const name = d.name || 'Un voyageur';
  switch (type) {
    case 'proposal':
      return {
        icon,
        title_fr: 'Nouvelle proposition', title_en: 'New proposal',
        body_fr: `${name} propose ${d.kg} kg à ${d.pricePerKg} €/kg (${d.from} → ${d.to}).`,
        body_en: `${name} offers ${d.kg} kg at ${d.pricePerKg} €/kg (${d.from} → ${d.to}).`,
        time: d.time || time,
      };
    case 'landing':
      return {
        icon,
        title_fr: 'Le vol a atterri 💡', title_en: 'Flight landed 💡',
        body_fr: 'Votre Code PIN de livraison est disponible sur votre espace de suivi.',
        body_en: 'Your delivery PIN is available on your tracking space.',
        time: d.time || time,
      };
    case 'shipment':
      return {
        icon,
        title_fr: 'Colis enregistré 📦', title_en: 'Parcel registered 📦',
        body_fr: `Votre colis ${d.ref} est prêt. Le voyageur le prendra en charge à l\u2019embarquement.`,
        body_en: `Your parcel ${d.ref} is ready. The traveler will pick it up at boarding.`,
        time: d.time || time,
      };
    case 'booking':
      return {
        icon,
        title_fr: 'Réservation confirmée ✅', title_en: 'Booking confirmed ✅',
        body_fr: `Votre réservation de ${d.kg} kg (${d.from} → ${d.to}) pour ${d.total} € est enregistrée.`,
        body_en: `Your booking of ${d.kg} kg (${d.from} → ${d.to}) for ${d.total} € is recorded.`,
        time: d.time || time,
      };
    case 'message':
      return {
        icon,
        title_fr: 'Nouveau message', title_en: 'New message',
        body_fr: `${d.name} : « ${d.text} »`,
        body_en: `${d.name}: "${d.text}"`,
        time: d.time || time,
      };
    case 'publish':
      return {
        icon,
        title_fr: d.isDemande ? 'Demande publiée 📢' : 'Départ publié 📢',
        title_en: d.isDemande ? 'Request published 📢' : 'Departure published 📢',
        body_fr: `${d.from} → ${d.to}${d.detail ? ' · ' + d.detail : ''}. ${d.isDemande ? 'Votre demande est en ligne.' : 'En attente de validation par un administrateur.'}`,
        body_en: `${d.from} → ${d.to}${d.detail ? ' · ' + d.detail : ''}. ${d.isDemande ? 'Your request is live.' : 'Awaiting validation by an admin.'}`,
        time: d.time || time,
      };
    case 'status': {
      const ok = d.status === 'confirme' || d.status === 'approved';
      return {
        icon,
        title_fr: ok ? 'Annonce validée ✅' : d.status === 'rejected' || d.status === 'annule' ? 'Annonce refusée ⚠️' : 'Statut mis à jour',
        title_en: ok ? 'Listing approved ✅' : d.status === 'rejected' || d.status === 'annule' ? 'Listing declined ⚠️' : 'Status updated',
        body_fr: `Votre annonce ${d.from ? d.from + ' → ' + d.to : ''} est ${ok ? 'confirmée' : d.status === 'rejected' || d.status === 'annule' ? 'refusée' : 'mise à jour'}.`,
        body_en: `Your listing ${d.from ? d.from + ' → ' + d.to : ''} is ${ok ? 'approved' : d.status === 'rejected' || d.status === 'annule' ? 'declined' : 'updated'}.`,
        time: d.time || time,
      };
    }
    default:
      return { icon, title_fr: d.title || 'Notification', title_en: d.title || 'Notification', body_fr: d.body || '', body_en: d.body || '', time: d.time || time };
  }
}

// ---------- Bus d'événements : notification temps réel (Dynamic Island) ----------
// Les écrans/composants peuvent s'abonner pour réagir à l'arrivée d'une notification.
const notifListeners = new Set();
export function subscribeNotifications(fn) {
  notifListeners.add(fn);
  return () => notifListeners.delete(fn);
}
function emitNotification(notif) {
  notifListeners.forEach((fn) => { try { fn(notif); } catch (e) {} });
}

export async function addNotification(d) {
  const list = await getNotifications();
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const notif = {
    id: 'n_' + Date.now(),
    read: false,
    type: d.type || 'info',
    ...buildNotification(d, time),
  };
  list.unshift(notif);
  await localStore.set(KEY_NOTIFS, list);
  // Diffuse en temps réel (capsule Dynamic Island, badges, listes…).
  emitNotification(notif);
  return list;
}

// Dernière notification non lue (pour la capsule à l'ouverture de l'app).
export async function getLatestUnread() {
  const list = await getNotifications();
  return (list || []).find((n) => !n.read) || null;
}

export async function markNotificationsRead() {
  const list = await getNotifications();
  await localStore.set(KEY_NOTIFS, list.map((n) => ({ ...n, read: true })));
  return list;
}

// ---------- Propositions (un voyageur propose ses kilos sur une demande) ----------
export async function getProposals() {
  return await localStore.get(KEY_PROPOSALS, []);
}

export async function createProposal({ demandId, date, kg, pricePerKg, message, from, to, senderName }) {
  const list = await localStore.get(KEY_PROPOSALS, []);
  const proposal = {
    id: 'p_' + Date.now(),
    demandId,
    date,
    kg: Number(kg),
    pricePerKg: Number(pricePerKg),
    total: Number(kg) * Number(pricePerKg),
    message,
    from,
    to,
    senderName,
    status: 'active',
    createdAt: Date.now(),
  };
  list.unshift(proposal);
  await localStore.set(KEY_PROPOSALS, list);
  // Notifie l'expéditeur de la demande + ouvre une conversation.
  await addNotification({
    type: 'proposal',
    name: proposal.senderName || 'Un voyageur',
    kg: proposal.kg,
    pricePerKg: proposal.pricePerKg,
    from: proposal.from,
    to: proposal.to,
  });
  await ensureConversation({
    name: proposal.senderName || 'Voyageur',
    last: `Proposition de ${proposal.kg} kg (${proposal.from} → ${proposal.to})`,
    time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  });
  return proposal;
}

// ---------- Suivi des colis (Espace Réservations : expéditeur / voyageur) ----------
// `role` : 'sender' (colis expédié/destinataire) | 'traveler' (colis porté par le voyageur)
// `status` : 'pending' (en attente de prise en charge) | 'in_transit' (en cours)
//            | 'landed' (atterri — PIN généré) | 'delivered' (livré)
// Sécurité : le PIN de livraison est TOUJOURS différent des chiffres de la
// référence du colis. Le voyageur connaît la référence (via le QR Code) mais
// ne doit jamais pouvoir en déduire le PIN secret, transmis séparément par
// l'expéditeur au moment de la livraison.
function genPin(ref) {
  const refDigits = String(ref || '').replace(/\D/g, '');
  let pin = String(Math.floor(1000 + Math.random() * 9000));
  while (pin === refDigits) {
    pin = String(Math.floor(1000 + Math.random() * 9000));
  }
  return pin;
}
function genRef() { return 'GP-' + String(Math.floor(1000 + Math.random() * 9000)); }
function genQR(ref) { return 'GP-SAFE-' + ref.replace('GP-', ''); }

export async function ensureShipmentsSeeded() {
  let list = await localStore.get(KEY_SHIPMENTS, null);
  if (list && list.length) return list;
  // Données de démonstration fidèles au modèle (une par onglet).
  const now = Date.now();
  list = [
    {
      // Référence publique (QR) GP-8921 — PIN de livraison DIFFÉRENT : 5730.
      id: 's1', ref: 'GP-8921', qrData: 'GP-SAFE-8921', role: 'sender', status: 'landed', pin: '5730',
      parcel: 'Vêtements & Documents', weight: 5, pricePerKg: 12, total: 60,
      from: 'Douala', to: 'Genève',
      fromCode: 'DLA', toCode: 'GVA', transport: 'Avion',
      counterparty: { name: 'Sophie M.', avatar: null, verified: true }, tripId: null,
      createdAt: now - 86400000,
    },
    {
      id: 's2', ref: 'GP-3164', qrData: null, role: 'traveler', status: 'pending', pin: null,
      parcel: 'Effets personnels', weight: 5, pricePerKg: 10, total: 50,
      from: 'Douala', to: 'Paris',
      fromCode: 'DLA', toCode: 'CDG', transport: 'Avion',
      counterparty: { name: 'Erick T.', avatar: null, verified: true }, tripId: null,
      createdAt: now - 43200000,
    },
    {
      id: 's3', ref: 'GP-7408', qrData: null, role: 'traveler', status: 'landed', pin: '2915',
      parcel: 'Ndjoka / Épices', weight: 10, pricePerKg: 14, total: 140,
      from: 'Yaoundé', to: 'Genève',
      fromCode: 'NSI', toCode: 'GVA', transport: 'Avion',
      counterparty: { name: 'Sophie M.', avatar: null, verified: true }, tripId: null,
      createdAt: now - 21600000,
    },
  ];
  await localStore.set(KEY_SHIPMENTS, list);
  return list;
}

export async function getShipments() {
  await ensureShipmentsSeeded();
  const list = await localStore.get(KEY_SHIPMENTS, []);
  // Rattrapage : les colis enregistrés avant l'ajout du tarif restent sans prix.
  // On leur attribue le tarif de la réservation (par défaut, démo : 12 €/kg).
  let changed = false;
  const next = (list || []).map((s) => {
    let out = s;
    // Migration sécurité : les anciens colis dont le PIN était identique aux
    // chiffres de la référence (transmis ensemble au voyageur) reçoivent un
    // nouveau PIN indépendant.
    const refDigits = String(s.ref || '').replace(/\D/g, '');
    if (s.pin && refDigits && s.pin === refDigits) {
      out = { ...out, pin: genPin(out.ref) };
      changed = true;
    }
    if (!out.pricePerKg) {
      changed = true;
      const rate = 12;
      out = { ...out, pricePerKg: rate, total: (Number(out.weight) || 0) * rate };
    }
    return out;
  });
  if (changed) await localStore.set(KEY_SHIPMENTS, next);
  return next;
}

// Crée (ou met à jour) le suivi d'un colis. Génère PIN + QR quand le vol atterrit.
export async function upsertShipment(data) {
  const list = await localStore.get(KEY_SHIPMENTS, []);
  const idx = list.findIndex((s) => s.id === data.id);
  const next = { ...data };
  if (next.status === 'landed' && !next.pin) {
    next.pin = genPin(next.ref || data.ref);
    next.qrData = genQR(next.ref || data.ref);
    await addNotification({ type: 'landing' });
  }
  if (!next.qrData) next.qrData = genQR(next.ref || 'GP-0000');
  if (idx >= 0) list[idx] = next;
  else list.unshift(next);
  await localStore.set(KEY_SHIPMENTS, list);
  return list;
}

// Transition de statut (scan de prise en charge, validation PIN, etc.)
export async function setShipmentStatus(id, status, extra = {}) {
  const list = await localStore.get(KEY_SHIPMENTS, []);
  const found = list.find((s) => s.id === id);
  let next = { ...found, ...extra };
  if (found) {
    next = { ...found, ...extra };
    if (status === 'landed' && !next.pin) {
      next.pin = genPin(next.ref || 'GP-0000');
      next.qrData = genQR(next.ref || 'GP-0000');
    }
    next.status = status;
  }
  const out = list.map((s) => (s.id === id ? next : s));
  await localStore.set(KEY_SHIPMENTS, out);
  return { found: next, list: out };
}

// Crée un suivi expéditeur à partir d'une réservation (au moment du book).
export async function createShipmentFromBooking({ reservation, trip }) {
  const list = await localStore.get(KEY_SHIPMENTS, []);
  const ref = genRef();
  const shipment = {
    id: 's_' + Date.now(),
    ref,
    qrData: genQR(ref),
    role: 'sender',
    status: 'pending',
    pin: null,
    parcel: (trip && (trip.description || trip.title)) || 'Colis',
    weight: Number(reservation.kg) || 0,
    // Prix de la réservation : tarif au kilo + total payé.
    pricePerKg: Number(reservation.pricePerKg) || 0,
    total: Number(reservation.total) || 0,
    from: reservation.from || (trip && trip.from) || '',
    to: reservation.to || (trip && trip.to) || '',
    transport: reservation.transport || (trip && trip.transport) || '',
    counterparty: trip && trip.traveler ? { name: trip.traveler.name, avatar: null, verified: trip.traveler.verified } : { name: reservation.userName || 'Voyageur', avatar: null, verified: false },
    tripId: reservation.tripId || (trip && trip.id) || null,
    createdAt: Date.now(),
  };
  list.unshift(shipment);
  await localStore.set(KEY_SHIPMENTS, list);
  await addNotification({ type: 'shipment', ref });
  return shipment;
}

// ---------- Messagerie (conversations persistées + notifications) ----------
export async function getConversations() {
  let list = await localStore.get(KEY_CONVERSATIONS, null);
  if (list && list.length) return list;
  // Conversation de démonstration.
  list = [
    {
      id: 'c1', name: 'Julien N.', initials: 'JN', last: 'Parfait, je réserve maintenant.', time: '09:18', unread: 1,
      messages: [
        { id: 'm1', from: 'them', text: 'Bonjour, votre départ Douala → Genève du 06.09 m\u2019intéresse. Il reste de la place pour une valise ?', time: '09:12' },
        { id: 'm2', from: 'me', text: 'Bonjour ! Oui il reste de la place. Elle pèse combien ?', time: '09:14' },
        { id: 'm3', from: 'them', text: 'Environ 22 kg. Quel est le tarif ?', time: '09:15' },
        { id: 'm4', from: 'me', text: '10 €/kg, soit 220 €. Vous pouvez réserver directement depuis l\u2019annonce.', time: '09:17' },
        { id: 'm5', from: 'them', text: 'Parfait, je réserve maintenant. Merci !', time: '09:18' },
      ],
    },
  ];
  await localStore.set(KEY_CONVERSATIONS, list);
  return list;
}

// Retourne la conversation et le message ajouté.
// Règle « envoyé = lu » : un message que J'ENVOIE marque la conversation
// comme lue (badge remis à zéro, aucune capsule) ; seul un message REÇU
// crée du non-lu et déclenche une notification.
export async function sendChatMessage({ convoId, from, text, name, kind }) {
  const list = await localStore.get(KEY_CONVERSATIONS, []);
  const idx = list.findIndex((c) => c.id === convoId);
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const msg = { id: 'm_' + Date.now(), from, text, time, ...(kind ? { kind } : {}) };
  let updated;
  if (idx >= 0) {
    const unread = from === 'them' ? (list[idx].unread || 0) + 1 : 0;
    updated = { ...list[idx], messages: [...list[idx].messages, msg], last: text, time, unread };
    list[idx] = updated;
  } else {
    updated = { id: convoId, name: name || 'Correspondant', initials: (name || 'C').slice(0, 2).toUpperCase(), last: text, time, messages: [msg], unread: from === 'them' ? 1 : 0 };
    list.unshift(updated);
  }
  await localStore.set(KEY_CONVERSATIONS, list);
  // Capsule UNIQUEMENT pour un message reçu (jamais pour ses propres envois).
  if (from === 'them') {
    await addNotification({ type: 'message', name: name || 'Correspondant', text });
  }
  return { conversation: updated, message: msg };
}

// Marque durablement une conversation comme lue (badge « non lus » à zéro).
export async function markConversationRead(convoId) {
  const list = await localStore.get(KEY_CONVERSATIONS, []);
  const idx = list.findIndex((c) => c.id === convoId);
  if (idx >= 0 && list[idx].unread) {
    list[idx] = { ...list[idx], unread: 0 };
    await localStore.set(KEY_CONVERSATIONS, list);
  }
  return list;
}

// Crée/retrouve une conversation vers un interlocuteur (voyageur, expéditeur...).
export async function ensureConversation({ name, initials, last, time, id }) {
  const list = await localStore.get(KEY_CONVERSATIONS, []);
  const existing = list.find((c) => c.name === name);
  if (existing) return existing;
  const convo = {
    id: id || ('c_' + Date.now()),
    name, initials: initials || (name || 'C').split(/[.\s]+/).map((p) => p[0]).join('').toUpperCase() || 'C',
    last: last || '', time: time || '', unread: 0, messages: [],
  };
  list.unshift(convo);
  await localStore.set(KEY_CONVERSATIONS, list);
  return convo;
}

// ---------- Signalements d'utilisateurs ----------
// Un signalement contient : la personne signalée, la raison rédigée et des
// preuves d'échange (photos / captures d'écran, jusqu'à 3).
export async function createReport({ against, againstId, reason, proofs, context }) {
  const list = await localStore.get(KEY_REPORTS, []);
  const report = {
    id: 'rep_' + Date.now(),
    against: against || 'Utilisateur',
    againstId: againstId || null,
    reason: reason || '',
    proofs: (proofs || []).filter(Boolean),
    context: context || null,
    status: 'sent',
    createdAt: Date.now(),
  };
  list.unshift(report);
  await localStore.set(KEY_REPORTS, list);
  return report;
}

export async function getReports() {
  return await localStore.get(KEY_REPORTS, []);
}
