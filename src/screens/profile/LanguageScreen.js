import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { ScreenHeader } from '../../components/common';
import { useLanguage } from '../../context/LanguageContext';

const LANGS = [
  { key: 'fr', label: 'Français' },
  { key: 'en', label: 'English' },
];

export default function LanguageScreen({ navigation }) {
  const { lang, chooseLang } = useLanguage();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Paramètres de langue" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Ionicons name="globe-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Sélectionnez votre langue préférée</Text>
          </View>
          {LANGS.map((l) => (
            <TouchableOpacity key={l.key} style={[styles.option, lang === l.key && styles.optionActive]} onPress={() => chooseLang(l.key)}>
              <Text style={[styles.optionText, lang === l.key && styles.optionTextActive]}>{l.label}</Text>
              {lang === l.key && <Ionicons name="checkmark" size={20} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Langue actuelle</Text>
          </View>
          <Text style={styles.current}>{lang === 'fr' ? 'Français' : 'English'}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: '5%', paddingVertical: spacing.lg },
  section: { backgroundColor: colors.inputBg, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, ...shadow.card },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.primaryDark, marginLeft: 8 },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.sm,
    borderWidth: 2, borderColor: colors.border,
  },
  optionActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  optionText: { fontSize: 15, fontWeight: '600', color: colors.text },
  optionTextActive: { color: colors.primary, fontWeight: '700' },
  current: { fontSize: 15, color: colors.text, fontWeight: '600' },
});
