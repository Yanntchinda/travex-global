import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { ScreenHeader, Stars, Button, Loading } from '../../components/common';
import { getRatings, ensureConversation } from '../../services/supabase';
import { useLanguage } from '../../context/LanguageContext';

// ---------------------------------------------------------------------------
// Profil public d'un voyageur : identité, note moyenne, statistiques et
// références (avis laissés par les autres utilisateurs).
// Navigation : TravelerProfile { traveler, travelerId }
// ---------------------------------------------------------------------------
export default function TravelerProfileScreen({ route, navigation }) {
  const { t } = useLanguage();
  const { traveler, travelerId } = route.params || {};
  const [ratings, setRatings] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getRatings(travelerId || traveler?.name).then(setRatings).catch(() => setRatings({ average: 0, count: 0, ratings: [] }));
  }, [travelerId, traveler]);

  if (!traveler) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title={t('traveler.title')} onBack={() => navigation.goBack()} />
        <Loading />
      </SafeAreaView>
    );
  }

  const average = ratings ? ratings.average : (traveler.rating || 0);
  const reviews = ratings ? ratings.count : (traveler.reviews || 0);
  const list = (ratings && ratings.ratings) || [];
  const trips = Math.max(reviews, traveler.stats?.voyages || 0);

  // Ouvre une conversation persistée avec ce voyageur puis saute sur le chat.
  const contact = async () => {
    setBusy(true);
    try {
      const convo = await ensureConversation({
        name: traveler.name || 'Voyageur',
        initials: traveler.initials,
        last: t('announce.contact'),
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      });
      navigation.navigate('Main', { screen: 'Messages', params: { openConvoId: convo.id } });
    } finally {
      setBusy(false);
    }
  };

  const report = () => {
    navigation.navigate('Report', {
      reportedName: traveler.name,
      reportedId: travelerId || traveler.name,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={t('traveler.title')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Carte identité */}
        <View style={styles.card}>
          <View style={styles.avatarWrap}>
            {traveler.photo ? (
              <Image source={traveler.photo} style={styles.avatarImg} />
            ) : traveler.avatar ? (
              <Image source={{ uri: traveler.avatar }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatar}><Text style={styles.avatarText}>{traveler.initials || 'V'}</Text></View>
            )}
            {traveler.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={16} color={colors.white} />
              </View>
            )}
          </View>
          <Text style={styles.name}>{traveler.name}</Text>
          {traveler.verified && (
            <View style={styles.verifiedPill}>
              <Ionicons name="shield-checkmark" size={13} color="#059669" />
              <Text style={styles.verifiedPillText}>{t('publish.verified')}</Text>
            </View>
          )}
          <View style={styles.ratingRow}>
            <Stars value={average} size={20} />
            <Text style={styles.ratingText}>{average.toFixed(1)}/5 · {reviews} {t('rate.reviews')}</Text>
          </View>
        </View>

        {/* Statistiques */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="airplane" size={20} color={colors.primary} />
            <Text style={styles.statValue}>{trips}</Text>
            <Text style={styles.statLabel}>{t('traveler.stats.trips')}</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="star" size={20} color={colors.star} />
            <Text style={styles.statValue}>{average.toFixed(1)}</Text>
            <Text style={styles.statLabel}>{t('traveler.stats.rating')}</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="chatbubbles" size={20} color={colors.accent} />
            <Text style={styles.statValue}>{reviews}</Text>
            <Text style={styles.statLabel}>{t('traveler.stats.reviews')}</Text>
          </View>
        </View>

        {/* Références (avis) */}
        <View style={styles.card}>
          <View style={styles.sectionRow}>
            <Ionicons name="ribbon-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>{t('traveler.references')}</Text>
          </View>
          {list.length === 0 ? (
            <Text style={styles.emptyText}>{t('traveler.noReferences')}</Text>
          ) : (
            list.slice(0, 8).map((r, i) => (
              <View key={i} style={styles.reference}>
                <Stars value={Number(r.score) || r} size={14} />
                <Text style={styles.referenceText}>
                  {t('traveler.stats.reviews')} · {' '}
                  {new Date(r.at || Date.now()).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Text>
              </View>
            ))
          )}
        </View>

        <Button title={t('traveler.contact')} icon="chatbubbles-outline" onPress={contact} loading={busy} />
        <Button
          title={t('traveler.report')}
          icon="flag-outline"
          variant="outline"
          onPress={report}
          style={{ marginTop: spacing.md }}
        />
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: '5%', paddingVertical: spacing.lg },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  avatarWrap: { alignSelf: 'center', position: 'relative' },
  avatar: {
    width: 92, height: 92, borderRadius: 46,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: colors.primary,
  },
  avatarText: { color: colors.primary, fontWeight: '900', fontSize: 30 },
  avatarImg: { width: 92, height: 92, borderRadius: 46 },
  verifiedBadge: {
    position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: colors.white,
  },
  name: { textAlign: 'center', fontSize: 21, fontWeight: '900', color: colors.text, marginTop: spacing.md },
  verifiedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'center',
    backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 14, marginTop: spacing.sm,
  },
  verifiedPillText: { color: '#059669', fontSize: 12, fontWeight: '800' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: spacing.md },
  ratingText: { fontSize: 14, color: colors.muted, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  statBox: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.border, alignItems: 'center', paddingVertical: spacing.lg, ...shadow.card,
  },
  statValue: { fontSize: 19, fontWeight: '900', color: colors.text, marginTop: 6 },
  statLabel: { fontSize: 12, color: colors.muted, fontWeight: '600', marginTop: 2 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.primaryDark, marginLeft: 8 },
  emptyText: { color: colors.muted, fontSize: 14, textAlign: 'center', paddingVertical: spacing.md },
  reference: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.inputBg, borderRadius: radius.sm,
    paddingHorizontal: spacing.md, paddingVertical: 10, marginBottom: spacing.sm,
  },
  referenceText: { fontSize: 12, color: colors.muted, fontWeight: '600' },
});
