// ============================================================
//  CONFIGURATION TRAVEX GLOBAL
// ============================================================
//  Pour passer du MODE DÉMO au MODE CLOUD (Supabase) :
//    1. Crée un projet gratuit sur https://supabase.com
//    2. Récupère l'URL du projet et la clé "anon public" (Settings > API)
//    3. Colle-les ci-dessous, puis relance l'app.
//  Laisse vide pour tester en local (mode démo) sans internet.
// ============================================================

export const SUPABASE_URL = '';
export const SUPABASE_ANON_KEY = '';

export const APP = {
  name: 'TRAVEX GLOBAL',
  version: '1.0.0',
};

// ============================================================
//  MODE D'INSCRIPTION & DE PUBLICATION (réversible)
// ============================================================
//  Mode ACTUEL : inscription simple (e-mail ou Google + références),
//  sans CNI ni vérification. Seuls les comptes listés ci-dessous
//  peuvent publier un DÉPART (voyage).
//
//  Pour REVENIR à l'ancien fonctionnement :
//    - REQUIRE_ID_VERIFICATION : true   (CNI + selfie obligatoires)
//    - RESTRICT_DEPARTURES     : false  (tout compte connecté peut publier)
// ============================================================
export const FEATURES = {
  REQUIRE_ID_VERIFICATION: false,
  RESTRICT_DEPARTURES: true,
};

// Comptes autorisés à publier un départ (e-mail en minuscules).
// Les comptes administrateur (role 'admin') sont toujours autorisés.
export const DEPARTURE_PUBLISHERS = ['yanntchinda813@gmail.com'];
