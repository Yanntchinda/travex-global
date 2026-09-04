// Service de stockage & authentification.
//
// Deux modes :
//   1. MODE DÉMO (par défaut) : tout est local (AsyncStorage). Aucune config requise.
//      -> Idéal pour tester l'app sans rien configurer.
//   2. MODE CLOUD (Supabase) : base PostgreSQL gratuite + auth + storage.
//      -> Active-le en renseignant SUPABASE_URL et SUPABASE_ANON_KEY
//         dans src/config.js (ou via variables d'environnement).
//
// Supabase offre une base gratuite (500 Mo) : crée un projet sur
// https://supabase.com, copie l'URL et la clé "anon public", puis colle-les
// dans src/config.js. Aucune carte bancaire requise pour le plan gratuit.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockTrips, tripDetail } from '../data/mockData';

// ============ CONFIG ============
// Renseigne ces valeurs pour passer en mode cloud.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

const CLOUD_ENABLED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let supabase = null;
if (CLOUD_ENABLED) {
  // Chargé dynamiquement pour ne pas casser le mode démo.
  const { createClient } = require('@supabase/supabase-js');
  require('react-native-url-polyfill/auto');
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
// =================================

const KEY_SESSION = 'travex.session';
const KEY_USER = 'travex.user';

// ---------- Stockage local (mode démo) ----------
export const localStore = {
  async get(key, fallback = null) {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  async set(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
  async remove(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },
};

// ---------- Authentification ----------
export async function signIn({ email, password }) {
  if (!email || !password) throw new Error('Veuillez renseigner l\u2019e-mail et le mot de passe.');
  if (CLOUD_ENABLED) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return { user: data.user };
  }
  // Mode démo : on crée/retrouve un utilisateur local lié à l'e-mail.
  const existing = await localStore.get(KEY_USER);
  if (existing && existing.email === email) return { user: existing };
  const user = buildDemoUser(email);
  return { user };
}

export async function signInWithGoogle() {
  if (CLOUD_ENABLED) {
    // NOTE : la connexion Google native sur mobile via Expo se fait avec
    // expo-auth-session / expo-web-browser. Ici on renvoie simplement un
    // "compte en attente de finalisation" pour reproduire le flux Treliko.
    return { needsFinalize: true, partial: { firstName: 'yann', lastName: 'Tchinda', email: 'yanntchinda813@gmail.com' } };
  }
  return { needsFinalize: true, partial: { firstName: 'yann', lastName: 'Tchinda', email: 'yanntchinda813@gmail.com' } };
}

export async function finalizeSignup(partial) {
  const user = {
    id: 'u_' + Date.now(),
    firstName: partial.firstName || 'yann',
    lastName: partial.lastName || 'Tchinda',
    email: partial.email || 'yanntchinda813@gmail.com',
    initials: ((partial.firstName || 'Y')[0] + (partial.lastName || 'T')[0]).toUpperCase(),
    verified: false,
    stats: { voyages: 0, demandes: 0, note: 0 },
  };
  await localStore.set(KEY_USER, user);
  await localStore.set(KEY_SESSION, 'active');
  return user;
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

function buildDemoUser(email) {
  const user = {
    id: 'u_' + Date.now(),
    firstName: 'yann',
    lastName: 'Tchinda',
    email,
    initials: 'YT',
    verified: false,
    stats: { voyages: 0, demandes: 0, note: 0 },
  };
  return user;
}

// ---------- Données d'annonces / voyages ----------
export async function fetchTrips() {
  if (CLOUD_ENABLED) {
    const { data, error } = await supabase.from('trips').select('*');
    if (error) throw new Error(error.message);
    return data || [];
  }
  await new Promise((r) => setTimeout(r, 250)); // simuler la latence réseau
  return mockTrips;
}

export async function fetchTripDetail(id) {
  if (CLOUD_ENABLED) {
    const { data, error } = await supabase.from('trips').select('*').eq('id', id).single();
    if (error) throw new Error(error.message);
    return data;
  }
  return tripDetail;
}

export async function createTrip(trip) {
  if (CLOUD_ENABLED) {
    const { data, error } = await supabase.from('trips').insert(trip).select().single();
    if (error) throw new Error(error.message);
    return data;
  }
  return { ...trip, id: 't_' + Date.now() };
}

// ---------- Base de données gratuite : exemple de migration ----------
// Exécute ce SQL une seule fois sur Supabase (SQL Editor) pour créer la table
// des annonces de voyage :
//
//   create table if not exists trips (
//     id uuid primary key default gen_random_uuid(),
//     user_id uuid references auth.users,
//     from_city text not null,
//     to_city text not null,
//     from_date text,
//     to_date text,
//     transport text,
//     price_kg numeric,
//     price_article numeric,
//     weight_kg numeric,
//     created_at timestamptz default now()
//   );
//   alter table trips enable row level security;
//   create policy "select" on trips for select using (true);
//   create policy "insert" on trips for insert with check (auth.uid() = user_id);
