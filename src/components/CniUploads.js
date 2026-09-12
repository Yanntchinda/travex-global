import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, radius } from '../theme/theme';
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
  darkLabel: { fontSize: 13, fontWeight: '600', color: '#E0E0E0', marginBottom: 7, marginTop: 10 },
  req: { color: '#F87171', fontWeight: '800' },
});
