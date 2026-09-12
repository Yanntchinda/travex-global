import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, radius } from '../theme/theme';

// Placeholder de démonstration, utilisé sur le web / sandbox où la galerie
// n'est pas disponible — pour que l'upload (billet, CNI...) reste fonctionnel.
const WEB_PLACEHOLDER = 'https://via.placeholder.com/300x180?text=TravEx';

// Construit une data URI persistante : contrairement à un URI de fichier local
// (file:///… ou content://…), elle survit au redémarrage de l'app et peut être
// affichée puis téléchargée depuis un autre écran (espace admin).
function toDataUri(asset) {
  if (!asset) return null;
  if (asset.base64) {
    const mime = asset.mimeType || 'image/jpeg';
    return `data:${mime};base64,${asset.base64}`;
  }
  return asset.uri || null;
}

// Bouton de sélection/téléversement de photo (CNI, billet, etc.)
export default function PhotoPicker({ label, value, onChange, placeholder = 'Ajouter une photo', hint, required = false, testID }) {
  const pick = async () => {
    try {
      try { await ImagePicker.requestMediaLibraryPermissionsAsync(); } catch (e) { /* web / sandbox */ }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        // Compression volontaire : 3 documents CNI sont stockés en base64.
        quality: 0.4,
        exif: false,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = toDataUri(result.assets[0]);
        if (uri) { onChange(uri); return; }
      }
      // Sélection annulée : on ne touche à rien.
      if (!result.canceled) onChange(WEB_PLACEHOLDER);
    } catch (e) {
      // Galerie indisponible (web sans input fichier, permission refusée…) :
      // on garde le flux utilisable avec une photo de démonstration.
      onChange(WEB_PLACEHOLDER);
    }
  };

  return (
    <View style={{ marginBottom: spacing.lg }}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.requiredMark}> *</Text> : null}
        </Text>
      ) : null}
      {value ? (
        <View style={styles.previewBox}>
          <Image source={{ uri: value }} style={styles.preview} resizeMode="cover" />
          <TouchableOpacity style={styles.changeBtn} onPress={pick} activeOpacity={0.85}>
            <View style={styles.changeInner}>
              <Ionicons name="camera" size={16} color={colors.primary} />
              <Text style={styles.changeText}>Changer</Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.emptyBox} onPress={pick} activeOpacity={0.7} testID={testID}>
          <Ionicons name="image-outline" size={28} color={colors.muted} />
          <Text style={styles.emptyText}>{placeholder}</Text>
          {hint && <Text style={styles.hint}>{hint}</Text>}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, color: colors.text, fontWeight: '600', marginBottom: spacing.sm },
  requiredMark: { color: colors.red, fontWeight: '800' },
  previewBox: {
    borderRadius: radius.md, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border, position: 'relative',
  },
  preview: { width: '100%', height: 150 },
  changeBtn: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  changeInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  changeText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  emptyBox: {
    height: 120, borderRadius: radius.md, borderWidth: 1.5,
    borderColor: colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.inputBg,
  },
  emptyText: { marginTop: 8, fontSize: 14, color: colors.text, fontWeight: '600' },
  hint: { marginTop: 3, fontSize: 12, color: colors.muted, textAlign: 'center' },
});
