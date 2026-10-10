// Magasin de données TRAVEX GLOBAL (stockage local AsyncStorage).
// Comptes clients, session, départs et réservations.
// Démo locale : les mots de passe sont stockés sur l'appareil. Un vrai backend
// (Supabase ou serveur) est nécessaire pour partager les données entre appareils.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OWNER, TRANSPORTS } from '../config';

const KEY_DB = 'travex.v2.db2';
const KEY_SESSION = 'travex.v2.session';

export const BOOKING_STATUS = {
  pending: 'en_attente',
  confirmed: 'confirmee',
  cancelled: 'annulee',
};

const SEED = {
  trips: [
    {
      id: 't_exemple_1', from: 'Douala', to: 'Genève', date: '2026-11-06', arrivalDate: '',
      transport: 'Avion', pricePerKg: 10, capacityKg: 23, status: 'open',
      description: 'Bagage cabine. Documents et petits colis acceptés.', createdAt: Date.now(),
    },
    {
      id: 't_exemple_2', from: 'Yaoundé', to: 'Paris', date: '2026-11-20', arrivalDate: '2026-11-21',
      transport: 'Avion', pricePerKg: 12, capacityKg: 15, status: 'open',
      description: 'Départ exemple. Vous pouvez le supprimer depuis l’espace admin.', createdAt: Date.now(),
    },
    {
      id: 't_exemple_3', from: 'Douala', to: 'Anvers', date: '2026-12-02', arrivalDate: '2026-12-18',
      transport: 'Cargo', pricePerKg: 2.5, capacityKg: 500, status: 'open',
      description: 'Fret maritime. Colis non dangereux uniquement, à déposer au port.', createdAt: Date.now(),
    },
    {
      id: 't_exemple_4', from: 'Douala', to: 'Marseille', date: '2026-12-05', arrivalDate: '2026-12-20',
      transport: 'RO-RO', pricePerKg: 1.2, capacityKg: 1000, status: 'open',
      description: 'Ferry roll-on/roll-off : véhicules et remorques, tarif au kg indicatif.', createdAt: Date.now(),
    },
  ],
  bookings: [],
  users: [],
};

const uid = (p) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const round2 = (n) => Math.round(n * 100) / 100;
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isIsoDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(new Date(`${v}T00:00:00`).getTime());

// ---------- Abonnement aux changements (mise à jour automatique des écrans) ----------
const listeners = new Set();
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function notifyAll() {
  listeners.forEach((fn) => {
    try { fn(); } catch (e) { /* un écran ne doit pas bloquer les autres */ }
  });
}

// ---------- Stockage ----------
async function save(db) {
  await AsyncStorage.setItem(KEY_DB, JSON.stringify(db));
  notifyAll();
}

async function load() {
  let db = null;
  try {
    const raw = await AsyncStorage.getItem(KEY_DB);
    if (raw) db = JSON.parse(raw);
  } catch (e) {
    db = null;
  }
  if (!db) {
    db = JSON.parse(JSON.stringify(SEED));
    await save(db);
  }
  db.trips = db.trips || [];
  db.bookings = db.bookings || [];
  db.users = db.users || [];
  return db;
}

async function getSession() {
  try {
    const raw = await AsyncStorage.getItem(KEY_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

async function setSession(s) {
  if (s) await AsyncStorage.setItem(KEY_SESSION, JSON.stringify(s));
  else await AsyncStorage.removeItem(KEY_SESSION);
  notifyAll();
}

const publicUser = (u) => {
  const { password, ...rest } = u;
  return rest;
};

// ---------- Places restantes ----------
function bookedKg(db, tripId) {
  return db.bookings
    .filter((b) => b.tripId === tripId && b.status !== BOOKING_STATUS.cancelled)
    .reduce((s, b) => s + Number(b.kg), 0);
}

function withRemaining(db, trip) {
  const booked = round2(bookedKg(db, trip.id));
  return {
    ...trip,
    bookedKg: booked,
    remainingKg: Math.max(0, round2(Number(trip.capacityKg) - booked)),
    bookingCount: db.bookings.filter((b) => b.tripId === trip.id && b.status !== BOOKING_STATUS.cancelled).length,
  };
}

// ---------- Validation départ / réservation ----------
function parseTrip(input) {
  const from = String(input.from || '').trim();
  const to = String(input.to || '').trim();
  if (!from || !to) throw new Error('Indiquez la ville de départ et la ville d’arrivée.');
  if (!isIsoDate(input.date || '')) throw new Error('Date de départ invalide.');
  if (input.arrivalDate && !isIsoDate(input.arrivalDate)) throw new Error('Date d’arrivée invalide.');
  const pricePerKg = Number(String(input.pricePerKg).replace(',', '.'));
  if (!(pricePerKg >= 0)) throw new Error('Indiquez un tarif par kg valide.');
  const capacityKg = Number(String(input.capacityKg).replace(',', '.'));
  if (!(capacityKg > 0)) throw new Error('Indiquez la capacité disponible en kg.');
  const transport = input.transport || 'Avion';
  if (!TRANSPORTS.includes(transport)) throw new Error('Mode de transport inconnu.');
  return {
    id: uid('t'),
    from,
    to,
    date: input.date,
    arrivalDate: input.arrivalDate || '',
    transport,
    pricePerKg: round2(pricePerKg),
    capacityKg: round2(capacityKg),
    description: String(input.description || '').trim(),
    status: 'open',
    createdAt: Date.now(),
  };
}

function parseBooking(input) {
  const firstName = String(input.firstName || '').trim();
  const lastName = String(input.lastName || '').trim();
  const phone = String(input.phone || '').trim();
  const email = String(input.email || '').trim();
  const city = String(input.city || '').trim();
  const note = String(input.note || '').trim();
  if (!firstName || !lastName) throw new Error('Indiquez votre prénom et votre nom.');
  if (phone.replace(/\D/g, '').length < 6) throw new Error('Indiquez un numéro de téléphone valide.');
  if (email && !isEmail(email)) throw new Error('Adresse e-mail invalide.');
  const kgValue = Number(String(input.kg).replace(',', '.'));
  if (!(kgValue > 0)) throw new Error('Indiquez le poids de votre colis en kg.');
  return { firstName, lastName, phone, email, city, note, kg: round2(kgValue) };
}

// ---------- Comptes clients ----------
export async function registerAccount(input) {
  const firstName = String(input.firstName || '').trim();
  const lastName = String(input.lastName || '').trim();
  const email = String(input.email || '').trim().toLowerCase();
  const phone = String(input.phone || '').trim();
  const city = String(input.city || '').trim();
  const password = String(input.password || '');
  if (!firstName || !lastName) throw new Error('Indiquez votre prénom et votre nom.');
  if (!isEmail(email)) throw new Error('Adresse e-mail invalide.');
  if (phone.replace(/\D/g, '').length < 6) throw new Error('Indiquez un numéro de téléphone valide.');
  if (password.length < 6) throw new Error('Le mot de passe doit contenir au moins 6 caractères.');
  const db = await load();
  if (db.users.some((u) => u.email === email)) throw new Error('Un compte existe déjà avec cet e-mail.');
  const user = { id: uid('u'), firstName, lastName, email, phone, city, password, createdAt: Date.now() };
  db.users.push(user);
  await save(db);
  await setSession({ role: 'user', userId: user.id });
  return publicUser(user);
}

export async function loginAccount(email, password) {
  const db = await load();
  const u = db.users.find((x) => x.email === String(email || '').trim().toLowerCase());
  if (!u || u.password !== password) throw new Error('E-mail ou mot de passe incorrect.');
  await setSession({ role: 'user', userId: u.id });
  return publicUser(u);
}

export async function updateProfile(patch) {
  const s = await getSession();
  if (!s || s.role !== 'user') throw new Error('Connectez-vous pour modifier vos informations.');
  const db = await load();
  const u = db.users.find((x) => x.id === s.userId);
  if (!u) throw new Error('Compte introuvable.');
  const firstName = String(patch.firstName ?? u.firstName).trim();
  const lastName = String(patch.lastName ?? u.lastName).trim();
  const phone = String(patch.phone ?? u.phone).trim();
  if (!firstName || !lastName) throw new Error('Prénom et nom sont obligatoires.');
  if (phone.replace(/\D/g, '').length < 6) throw new Error('Numéro de téléphone invalide.');
  Object.assign(u, { firstName, lastName, phone, city: String(patch.city ?? u.city).trim() });
  await save(db);
  return publicUser(u);
}

// Informations de la session en cours : { role: 'user' | 'admin' | null, user? }
export async function getSessionInfo() {
  const s = await getSession();
  if (!s) return { role: null };
  if (s.role === 'admin') return { role: 'admin' };
  const db = await load();
  const u = db.users.find((x) => x.id === s.userId);
  if (!u) return { role: null };
  return { role: 'user', user: publicUser(u) };
}

export async function logout() {
  await setSession(null);
}

export async function getMyBookings() {
  const s = await getSession();
  if (!s || s.role !== 'user') return [];
  const db = await load();
  return db.bookings
    .filter((b) => b.userId === s.userId)
    .map((b) => {
      const tr = db.trips.find((x) => x.id === b.tripId);
      return { ...b, trip: tr ? { from: tr.from, to: tr.to, date: tr.date, transport: tr.transport } : null };
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

// ---------- Départs (lecture publique) ----------
export async function listOpenTrips({ from = '', to = '', transport = '' } = {}) {
  const db = await load();
  const f = from.trim().toLowerCase();
  const t = to.trim().toLowerCase();
  return db.trips
    .filter((tr) => tr.status === 'open')
    .filter((tr) => !transport || tr.transport === transport)
    .map((tr) => withRemaining(db, tr))
    .filter((tr) => tr.remainingKg > 0)
    .filter((tr) => (!f || tr.from.toLowerCase().includes(f)) && (!t || tr.to.toLowerCase().includes(t)))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getTrip(id) {
  const db = await load();
  const tr = db.trips.find((x) => x.id === id);
  return tr ? withRemaining(db, tr) : null;
}

// ---------- Réservations ----------
export async function createBooking(tripId, input) {
  // Réserver exige un compte client connecté (les visiteurs peuvent seulement consulter).
  const s = await getSession();
  if (!s || s.role !== 'user') throw new Error('Connectez-vous ou créez un compte pour réserver.');
  const data = parseBooking(input);
  const db = await load();
  const tr = db.trips.find((x) => x.id === tripId);
  if (!tr || tr.status !== 'open') throw new Error('Ce départ n’est plus disponible.');
  const remaining = withRemaining(db, tr).remainingKg;
  if (data.kg > remaining) {
    throw new Error(remaining > 0 ? `Il ne reste que ${remaining} kg sur ce départ.` : 'Ce départ est complet.');
  }
  const booking = {
    id: uid('b'),
    ref: genRef(db),
    tripId: tr.id,
    userId: s.userId,
    ...data,
    pricePerKg: tr.pricePerKg,
    total: round2(data.kg * tr.pricePerKg),
    status: BOOKING_STATUS.pending,
    createdAt: Date.now(),
  };
  db.bookings.unshift(booking);
  await save(db);
  return { booking, trip: withRemaining(db, tr) };
}

function genRef(db) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (;;) {
    let ref = 'TG-';
    for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
    if (!db.bookings.some((b) => b.ref === ref)) return ref;
  }
}

// ---------- Espace administrateur ----------
export async function adminLogin(email, password) {
  const ok = String(email || '').trim().toLowerCase() === OWNER.email && password === OWNER.password;
  if (!ok) throw new Error('Identifiants administrateur incorrects.');
  await setSession({ role: 'admin' });
  return true;
}

export async function isAdmin() {
  const s = await getSession();
  return !!s && s.role === 'admin';
}

export async function listAllTrips({ transport = '' } = {}) {
  const db = await load();
  return db.trips
    .filter((tr) => !transport || tr.transport === transport)
    .map((tr) => withRemaining(db, tr))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function publishTrip(input) {
  const db = await load();
  const trip = parseTrip(input);
  db.trips.unshift(trip);
  await save(db);
  return withRemaining(db, trip);
}

export async function setTripStatus(id, status) {
  const db = await load();
  const tr = db.trips.find((x) => x.id === id);
  if (!tr) throw new Error('Départ introuvable.');
  tr.status = status === 'open' ? 'open' : 'closed';
  await save(db);
}

export async function deleteTrip(id) {
  const db = await load();
  db.trips = db.trips.filter((x) => x.id !== id);
  db.bookings = db.bookings.filter((b) => b.tripId !== id);
  await save(db);
}

// Réservations filtrées par mode de transport et/ou par départ (vue admin)
export async function listBookings({ transport = '', tripId = '' } = {}) {
  const db = await load();
  return db.bookings
    .map((b) => {
      const tr = db.trips.find((x) => x.id === b.tripId);
      return {
        ...b,
        trip: tr ? { id: tr.id, from: tr.from, to: tr.to, date: tr.date, transport: tr.transport, capacityKg: tr.capacityKg } : null,
      };
    })
    .filter((b) => !tripId || b.tripId === tripId)
    .filter((b) => !transport || (b.trip && b.trip.transport === transport))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function setBookingStatus(id, status) {
  const db = await load();
  const b = db.bookings.find((x) => x.id === id);
  if (!b) throw new Error('Réservation introuvable.');
  if (status !== BOOKING_STATUS.cancelled && b.status === BOOKING_STATUS.cancelled) {
    const tr = db.trips.find((x) => x.id === b.tripId);
    if (tr && withRemaining(db, tr).remainingKg < Number(b.kg)) {
      throw new Error('Plus assez de place sur ce départ pour réactiver cette réservation.');
    }
  }
  b.status = status;
  await save(db);
}
