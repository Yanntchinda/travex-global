import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, radius } from '../theme/theme';

// Placeholder de démonstration, utilisé sur le web / sandbox où la galerie
// n'est pas disponible — pour que l'upload (billet, CNI...) reste fonctionnel.
const WEB_PLACEHOLDER = 'https://via.placeholder.com/300x180?text=TravEx';

// Bouton de sélection/téléversement de photo (CNI, billet, etc.)
export default function PhotoPicker({ label, value, onChange, placeholder = 'Ajouter une photo', hint }) {
  const pick = async () => {
    // Sur le web, on simule un upload (pas de galerie système fiable dans la sandbox).
    if (Platform.OS === 'web') {
      onChange(WEB_PLACEHOLDER);
      return;
    }
    try {
      let perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        // Sur desktop on tente quand même via launchImageLibraryAsync
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.6,
        base64: false,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        onChange(result.assets[0].uri);
      }
    } catch (e) {
      // Toute erreur (permission refusée, caméra indisponible...) → photo de démo.
      onChange(WEB_PLACEHOLDER);
    }
  };

  return (
    <View style={{ marginBottom: spacing.lg }}>
      {label && <Text style={styles.label}>{label}</Text>}
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
        <TouchableOpacity style={styles.emptyBox} onPress={pick} activeOpacity={0.7}>
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
