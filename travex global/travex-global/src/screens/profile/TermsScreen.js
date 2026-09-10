import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { ScreenHeader } from '../../components/common';
import { useLanguage } from '../../context/LanguageContext';

export default function TermsScreen({ navigation }) {
  const { t } = useLanguage();
  const sections = [1, 2, 3, 4, 5].map((i) => ({ title: t('terms.' + i + '.t'), body: t('terms.' + i + '.b') }));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={t('terms.title')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Ionicons name="document-text-outline" size={26} color={colors.primary} />
          <Text style={styles.introText}>{t('terms.subtitle')}</Text>
        </View>
        {sections.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{i + 1}. {s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  intro: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight,
    borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.lg, gap: 10,
  },
  introText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 21 },
  section: {
    backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.primaryDark, marginBottom: spacing.sm },
  sectionBody: { fontSize: 14, color: colors.text, lineHeight: 22 },
});
