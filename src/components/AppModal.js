import React, { useEffect } from 'react';
import { Modal, View, StyleSheet, Platform } from 'react-native';

// ---------------------------------------------------------------------------
// AppModal — remplacement universel du <Modal> de react-native-web.
//
// POURQUOI ? Sur web, le Modal RNW rend son contenu dans un PORTAIL ajouté
// au <body>, HORS de l'arbre React principal. Or le système de « responders »
// de RNW (qui déclenche onPress des TouchableOpacity/Pressable) ne traite pas
// les pressions provenant de ces portails : TOUS les boutons placés dans une
// modale étaient inertes sur l'aperçu web (modale langue, mot de passe
// oublié, confirmation de réservation…). Saisie de texte et navigation
// fonctionnaient, seuls les appuis étaient morts.
//
// SOLUTION : sur web, on rend une superposition INTÉGRÉE à l'écran
// (position absolute + zIndex très élevé) — même arbre React que le reste de
// l'app, là où les pressions sont fiables. Sur iOS/Android, on garde le vrai
// Modal natif (comportement d'origine, rien ne change).
//
// API compatible avec l'usage existant : transparent, visible, animationType
// (ignoré sur web — apparition instantanée), onRequestClose (Escape sur web).
// ---------------------------------------------------------------------------
export default function AppModal({ transparent = true, visible, animationType, onRequestClose, children }) {
  // Échap ferme la modale (parité avec le comportement natif/web de RNW).
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible || !onRequestClose) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onRequestClose(); };
    document.addEventListener('keyup', onKey);
    return () => document.removeEventListener('keyup', onKey);
  }, [visible, onRequestClose]);

  if (Platform.OS === 'web') {
    if (!visible) return null;
    return (
      <View style={styles.overlay} pointerEvents="auto">
        {children}
      </View>
    );
  }
  return (
    <Modal transparent={transparent} visible={visible} animationType={animationType} onRequestClose={onRequestClose}>
      {children}
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Superposition plein écran au-dessus de tout (barre d'onglets incluse).
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9998,
    elevation: 9998,
  },
});
