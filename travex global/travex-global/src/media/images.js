// ============================================================
//  IMAGES DE L'APPLICATION — point unique
//  Pour changer une image, modifiez seulement ce fichier.
//  Toutes les images sont dans /assets/wide4 et /assets/wide5 (format panoramique, 3 : 1).
// ============================================================

// Bannière du slider d'accueil
export const IMAGES = {
  bannerAerien: require('../../assets/wide4/voyageurs.jpg'),            // accueil : voyageurs
  bannerBagage: require('../../assets/wide4/avion-cargo.jpg'),          // accueil : avion cargo
  bannerCargo: require('../../assets/wide4/navire-depart.jpg'),         // accueil : navire qui part
  bannerRoRo: require('../../assets/wide5/ro-ro.jpg'),  // accueil : ferry RO-RO
};

// Image d'en-tête de chaque onglet de transport
export const MODE_HEADERS = {
  Avion: IMAGES.bannerBagage,
  Cargo: IMAGES.bannerCargo,
  'RO-RO': IMAGES.bannerRoRo,
};

// Image de fond de l'écran de connexion (plein écran : image verticale gardée)
export const LOGIN_BACKGROUND = require('../../assets/generated/voyageurs.jpg');
