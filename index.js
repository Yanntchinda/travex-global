import { Platform } from 'react-native';
import { registerRootComponent } from 'expo';

import App from './App';

// ---------------------------------------------------------------------------
// Aperçu web « format téléphone Android »
// Sur grand écran (ordinateur), l'application est présentée dans un cadre
// mobile (largeur type Android ~ 412 dp) centré sur un fond sombre, comme sur
// un vrai téléphone. Sur un petit écran (< 480 px), l'app occupe tout l'écran.
// Les modales React Native (rendues dans des portails ajoutés au <body>)
// héritent du même cadre pour rester dans le téléphone.
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
      body > div {
        position: absolute !important;
        top: 50% !important;
        left: 50% !important;
        right: auto !important;
        bottom: auto !important;
        width: 412px !important;
        height: min(880px, 94vh) !important;
        transform: translate(-50%, -50%) !important;
        border-radius: 34px !important;
        overflow: hidden !important;
        background: #ffffff !important;
        box-shadow:
          0 0 0 11px #10161f,
          0 0 0 13px #2a3a52,
          0 34px 90px rgba(0, 0, 0, 0.65) !important;
      }
    }
    @media (max-width: 479px) {
      body > div { width: 100%; height: 100%; }
    }
  `;
  document.head.appendChild(style);
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
