import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { ScreenHeader, Stars, RatingInput, Button } from '../../components/common';
import { getRatings, rateTarget } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function RatingsScreen({ navigation }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [given, setGiven] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState({ average: 0, count: 0, ratings: [] });

  const load = useCallback(async () => {
    // Affiche la moyenne reçue sur le profil + permet de noter la plateforme.
    const data = await getRatings(user?.id || 'me');
    setScore(data);
  }, [user?.id]);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!given) {
      Alert.alert(t('rate.title'), t('rate.hint'));
      return;
    }
    await rateTarget(user?.id || 'me', given);
    setSubmitted(true);
    setGiven(0);
    load();
  };

  // Distribution des notes (1 à 5) pour la moyenne reçue.
  const dist = [5, 4, 3, 2, 1].map((v) => ({
    v,
    n: score.ratings.filter((r) => Number(r.score) === v).length,
  }));
  const maxN = Math.max(1, ...dist.map((d) => d.n));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={t('rate.myTitle')} onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        {/* Votre note moyenne (reçue) */}
        <View style={styles.avgCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="star" size={18} color={colors.primary} />
            <Text style={styles.avgTitle}>{t('rate.avg')}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}>
            <Stars value={score.average} size={28} />
            <Text style={styles.avgNumber}>{score.average.toFixed(1)}</Text>
          </View>
          <Text style={styles.avgCount}>{score.count} {t('rate.reviews')}</Text>

          {/* Barres de distribution */}
          {dist.map((d) => (
            <View key={d.v} style={styles.distRow}>
              <Text style={styles.distLabel}>{d.v}</Text>
              <View style={styles.distTrack}>
                <View style={[styles.distFill, { width: `${(d.n / maxN) * 100}%` }]} />
              </View>
              <Text style={styles.distCount}>{d.n}</Text>
            </View>
          ))}
        </View>

        {/* Noter la plateforme */}
        <View style={styles.rateCard}>
          <View style={styles.sectionHead}>
            <Ionicons name="create-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>{t('rate.give')}</Text>
          </View>
          <Text style={styles.rateHint}>{t('rate.giveHint')}</Text>
          <RatingInput value={given} onChange={(v) => { setGiven(v); setSubmitted(false); }} />
          {given > 0 && (
            <Text style={styles.givenText}>{t('rate.yourNote')} : {given}/5</Text>
          )}
          <Button title={t('rate.submit')} onPress={submit} style={{ marginTop: spacing.md }} />
          {submitted && <Text style={styles.saved}>{t('rate.saved')}</Text>}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  avgCard: {
    backgroundColor: colors.inputBg, borderRadius: radius.lg, padding: spacing.xl,
    marginBottom: spacing.lg, ...shadow.card,
  },
  avgTitle: { fontSize: 15, fontWeight: '700', color: colors.primaryDark, marginLeft: 8 },
  avgNumber: { fontSize: 28, fontWeight: '800', color: colors.text, marginLeft: spacing.md },
  avgCount: { fontSize: 13, color: colors.muted, marginTop: 2, textAlign: 'center' },
  distRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: 8 },
  distLabel: { width: 14, fontSize: 13, color: colors.muted, textAlign: 'center' },
  distTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' },
  distFill: { height: 8, backgroundColor: colors.star, borderRadius: 4 },
  distCount: { width: 18, fontSize: 13, color: colors.muted, textAlign: 'right' },
  rateCard: {
    backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.primaryDark, marginLeft: 8 },
  rateHint: { fontSize: 14, color: colors.muted, marginBottom: spacing.md },
  givenText: { textAlign: 'center', color: colors.accent, fontWeight: '700', marginTop: spacing.sm },
  saved: { textAlign: 'center', color: colors.green, fontWeight: '600', marginTop: spacing.md },
});
