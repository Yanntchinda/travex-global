import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { ScreenHeader } from '../../components/common';
import { useLanguage } from '../../context/LanguageContext';
import { APP } from '../../config';

export default function PrivacyScreen({ navigation }) {
  const { t } = useLanguage();
  const sections = [1, 2, 3, 4, 5, 6].map((i) => ({ title: t('privacy.' + i + '.t'), body: t('privacy.' + i + '.b') }));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={t('privacy.title')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Ionicons name="shield-checkmark-outline" size={26} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.introTitle}>{t('privacy.title')}</Text>
            <Text style={styles.introText}>{t('privacy.subtitle')}</Text>
            <Text style={styles.updated}>{t('privacy.updated')}</Text>
          </View>
        </View>

        {sections.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{i + 1}. {s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}

        <View style={styles.contact}>
          <Ionicons name="mail-outline" size={20} color={colors.primary} />
          <View style={{ marginLeft: spacing.md, flex: 1 }}>
            <Text style={styles.contactTitle}>{t('privacy.contact')}</Text>
            <Text style={styles.contactText}>privacy@{APP.name.toLowerCase().replace(/\s+/g, '')}.com</Text>
            <Text style={styles.contactText}>{APP.name}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: '5%', paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  intro: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.primaryLight,
    borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.lg, gap: 12,
  },
  introTitle: { fontSize: 16, fontWeight: '800', color: colors.primaryDark },
  introText: { fontSize: 14, color: colors.text, lineHeight: 21, marginTop: 4 },
  updated: { fontSize: 12, color: colors.muted, marginTop: 8, fontStyle: 'italic' },
  section: {
    backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.primaryDark, marginBottom: spacing.sm },
  sectionBody: { fontSize: 14, color: colors.text, lineHeight: 22 },
  contact: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.white,
    borderRadius: radius.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  contactTitle: { fontSize: 15, fontWeight: '700', color: colors.primaryDark, marginBottom: 4 },
  contactText: { fontSize: 14, color: colors.text, lineHeight: 20 },
});
