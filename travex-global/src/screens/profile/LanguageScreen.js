import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { ScreenHeader } from '../../components/common';

const LANGS = ['Français', 'English'];

export default function LanguageScreen({ navigation }) {
  const [lang, setLang] = useState('Français');

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
            <TouchableOpacity key={l} style={[styles.option, lang === l && styles.optionActive]} onPress={() => setLang(l)}>
              <Text style={[styles.optionText, lang === l && styles.optionTextActive]}>{l}</Text>
              {lang === l && <Ionicons name="checkmark" size={20} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Langue actuelle</Text>
          </View>
          <Text style={styles.current}>{lang}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
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
