import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';
import PhotoPicker from './PhotoPicker';
import { useLanguage } from '../context/LanguageContext';

// ---------------------------------------------------------------------------
// Les TROIS documents d'identité exigés. Le NUMÉRO de CNI n'est plus demandé :
//   1. CNI — recto
//   2. CNI — verso
//   3. la personne tenant sa CNI en main
// Utilisé à l'inscription, dans « Changer de statut » et affiché côté admin.
// ---------------------------------------------------------------------------
export const CNI_FIELDS = [
  { key: 'front', labelKey: 'cni.front', hintKey: 'cni.frontHint' },
  { key: 'back', labelKey: 'cni.back', hintKey: 'cni.backHint' },
  { key: 'selfie', labelKey: 'cni.selfie', hintKey: 'cni.selfieHint' },
];

// Clés manquantes (pour la validation des formulaires).
export function missingCniFields(value) {
  return CNI_FIELDS.filter((f) => !value || !value[f.key]).map((f) => f.key);
}

export default function CniUploads({ value, onChange, dark = false }) {
  const { t } = useLanguage();
  const v = value || {};
  const set = (key) => (uri) => onChange({ ...(value || {}), [key]: uri });

  return (
    <View>
      <View style={[styles.infoBox, dark && styles.infoBoxDark]}>
        <Ionicons name="shield-checkmark-outline" size={16} color={dark ? '#7DD3FC' : colors.accent} />
        <Text style={[styles.infoText, dark && styles.infoTextDark]}>{t('cni.intro')}</Text>
      </View>

      {CNI_FIELDS.map((f) => (
        <View key={f.key}>
          {dark ? (
            <Text style={styles.darkLabel}>
              {t(f.labelKey)}
              <Text style={styles.req}> *</Text>
            </Text>
          ) : null}
          <PhotoPicker
            label={dark ? null : t(f.labelKey)}
            required={!dark}
            value={v[f.key]}
            onChange={set(f.key)}
            placeholder={t('cni.add')}
            hint={t(f.hintKey)}
            testID={'cni-' + f.key}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#EAF7F5', borderRadius: radius.sm,
    borderWidth: 1, borderColor: '#BFE6E0',
    paddingHorizontal: spacing.md, paddingVertical: 10, marginBottom: spacing.md,
  },
  infoBoxDark: { backgroundColor: 'rgba(125,211,252,0.10)', borderColor: 'rgba(125,211,252,0.25)' },
  infoText: { flex: 1, fontSize: 12, lineHeight: 17, color: '#0B6B60', fontWeight: '600' },
  infoTextDark: { color: 'rgba(224,240,255,0.85)' },
  darkLabel: { fontSize: 13, fontWeight: '600', color: '#E0E0E0', marginBottom: 7, marginTop: 10 },
  req: { color: '#F87171', fontWeight: '800' },
});
