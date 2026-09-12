import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { ScreenHeader } from '../../components/common';
import { useLanguage } from '../../context/LanguageContext';

export default function FaqScreen({ navigation }) {
  const { t } = useLanguage();
  const items = [1, 2, 3, 4, 5, 6, 7].map((i) => ({ q: t('faq.q' + i), a: t('faq.a' + i) }));
  const [open, setOpen] = useState(0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={t('faq.title')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {items.map((it, i) => (
          <TouchableOpacity key={i} style={styles.item} onPress={() => setOpen(open === i ? -1 : i)} activeOpacity={0.85}>
            <View style={styles.qRow}>
              <Text style={styles.q}>{it.q}</Text>
              <Ionicons name={open === i ? 'chevron-up' : 'chevron-down'} size={20} color={colors.primary} />
            </View>
            {open === i && <Text style={styles.a}>{it.a}</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: '5%', paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  item: {
    backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  qRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  q: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text, marginRight: spacing.sm },
  a: { fontSize: 14, color: colors.muted, lineHeight: 22, marginTop: spacing.md },
});
