import { Platform } from 'react-native';
import { registerRootComponent } from 'expo';

import App from './App';

// ---------------------------------------------------------------------------
// Aperçu web « format téléphone Android »
// Sur grand écran (ordinateur), l'application est présentée dans un cadre
// mobile (largeur type Android ~ 412 dp) centré sur un fond sombre, comme sur
// un vrai téléphone. Sur un petit écran (< 480 px), l'app occupe tout l'écran.
//
// IMPORTANT : on cible uniquement #root. React Native Web ajoute au <body>
// un div par <Modal> (même fermée) ; styliser « body > div » transformerait
// ces portails vides en boîtes blanches par-dessus l'app (page blanche +
// clics bloqués). Les portails de modales reçoivent la même géométrie que le
// cadre : le transform crée un containing block qui confine leurs
// position:fixed DANS le cadre téléphone, et pointer-events:none les rend
// inoffensifs tant que la modale est fermée.
// ---------------------------------------------------------------------------
if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    html, body { height: 100%; margin: 0; padding: 0; }
    body {
      background: radial-gradient(circle at 50% 0%, #16324f 0%, #0b1424 55%, #070d18 100%);
      overflow: hidden;
    }
    @media (min-width: 480px) {
      #root {
        position: absolute !important;
        top: 50% !important;
        left: 50% !important;
        right: auto !important;
        bottom: auto !important;
        width: 412px !important;
        /* Fallbacks universels (pas de min(), non supporté par les vieux navigateurs) */
        height: 94vh !important;
        max-height: 880px !important;
        transform: translate(-50%, -50%) !important;
        border-radius: 34px !important;
        overflow: hidden !important;
        background: #ffffff !important;
        box-shadow:
          0 0 0 11px #10161f,
          0 0 0 13px #2a3a52,
          0 34px 90px rgba(0, 0, 0, 0.65) !important;
      }
      /* Portails des modales RNW : même géométrie que le cadre téléphone. */
      body > div:not(#root) {
        position: absolute !important;
        top: 50% !important;
        left: 50% !important;
        right: auto !important;
        bottom: auto !important;
        width: 412px !important;
        height: 94vh !important;
        max-height: 880px !important;
        transform: translate(-50%, -50%) !important;
        border-radius: 34px !important;
        overflow: hidden !important;
        pointer-events: none !important;
      }
      /* Contenu des modales : réactive les événements et le confine au cadre. */
      body > div:not(#root) * {
        pointer-events: auto !important;
      }
    }
  `;
  document.head.appendChild(style);
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
