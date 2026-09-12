import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { EmptyState, Badge } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { fetchMyAnnouncements, setAnnouncementHidden } from '../../services/supabase';

export default function AnnoncesScreen({ navigation }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [tab, setTab] = useState('attente');
  const [items, setItems] = useState([]);

  // Mes annonces : celles du compte connecté + les demandes publiées en
  // INVITÉ depuis cet appareil (un demandeur n'a pas besoin de compte).
  const load = useCallback(async () => {
    const list = await fetchMyAnnouncements();
    setItems(list);
  }, []);

  // Masque / réaffiche une annonce — action réservée au propriétaire (ici).
  const toggleHidden = async (a) => {
    await setAnnouncementHidden(a.id, !a.hidden);
    load();
  };

  // Recharge à chaque retour sur l'onglet : la publication apparaît immédiatement.
  useEffect(() => {
    load();
    const unsub = navigation.addListener('focus', () => load());
    return unsub;
  }, [load, navigation]);

  if (!user) {
    // Invité : ses demandes d'expédition publiées sans compte restent visibles ici.
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Text style={styles.title}>{t('lists.mine')}</Text>
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <View style={styles.guestBanner}>
            <Ionicons name="information-circle-outline" size={18} color={colors.accent} />
            <Text style={styles.guestBannerText}>{t('lists.guestHint')}</Text>
          </View>
          {items.length === 0 ? (
            <EmptyState icon="list-outline" title={t('lists.empty')} subtitle={t('lists.emptyDesc')} />
          ) : (
            items.map((a) => (
              <View key={a.id} style={[styles.card, a.hidden && styles.cardHidden]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.iconBox}><Ionicons name="trending-up" size={20} color={colors.accent} /></View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text style={styles.route}>{a.from} → {a.to}</Text>
                    <Text style={styles.meta}>{a.title || a.date}</Text>
                  </View>
                </View>
                <View style={{ marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Badge
                    label={a.status === 'attente' ? t('publish.pending') : t('lists.live')}
                    color={a.status === 'attente' ? '#FCF3DF' : '#ECFDF5'}
                    textColor={a.status === 'attente' ? '#8A5B12' : '#047857'}
                    icon={a.status === 'attente' ? 'time' : 'checkmark-circle'}
                  />
                  <Badge label={t('publish.guestBadge')} color="#EEF1F5" textColor={colors.muted} icon="person-circle-outline" />
                </View>
              </View>
            ))
          )}
          <TouchableOpacity style={styles.guestBtn} onPress={() => navigation.navigate('SignIn')}>
            <Ionicons name="person-add-outline" size={16} color={colors.primary} />
            <Text style={styles.guestBtnText}>{t('lists.guestBtn')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Onglet 1 : publications en attente de vérification (départs ET demandes).
  // Onglet 2 : publications vérifiées par un administrateur.
  const pendingCount = items.filter((a) => a.status === 'attente').length;
  const verifiedCount = items.filter((a) => a.status === 'confirme').length;
  const list = tab === 'attente' ? items.filter((a) => a.status === 'attente') : items.filter((a) => a.status === 'confirme');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>{t('lists.mine')}</Text>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'attente' && styles.tabActive]} onPress={() => setTab('attente')}>
          <Text style={[styles.tabText, tab === 'attente' && styles.tabTextActive]}>
            {t('lists.pending')}{pendingCount > 0 ? ` (${pendingCount})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'confirme' && styles.tabActive]} onPress={() => setTab('confirme')}>
          <Text style={[styles.tabText, tab === 'confirme' && styles.tabTextActive]}>
            {t('lists.confirmed')}{verifiedCount > 0 ? ` (${verifiedCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {list.length === 0 && (
          <EmptyState
            icon={tab === 'attente' ? 'time-outline' : 'checkmark-done-outline'}
            title={tab === 'attente' ? t('lists.noPending') : t('lists.noConfirmed')}
            subtitle={t('lists.emptyDesc')}
          />
        )}
        {list.map((a) => (
          <View key={a.id} style={[styles.card, a.hidden && styles.cardHidden]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.iconBox}><Ionicons name={a.isDemande ? 'trending-up' : 'airplane'} size={20} color={a.isDemande ? colors.accent : colors.primary} /></View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.route}>{a.from} → {a.to}</Text>
                <Text style={styles.meta}>{a.transport ? a.transport + ' · ' : ''}{a.date}</Text>
              </View>
              {/* Masquer / réafficher : uniquement ici, dans le profil de l'utilisateur */}
              <TouchableOpacity style={styles.hideBtn} onPress={() => toggleHidden(a)} activeOpacity={0.8}>
                <Ionicons name={a.hidden ? 'eye' : 'eye-off'} size={18} color={a.hidden ? colors.green : colors.muted} />
                <Text style={[styles.hideText, a.hidden && { color: colors.green }]}>
                  {a.hidden ? t('lists.unhide') : t('lists.hide')}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Badge
                // Départ validé → « Vérifié » ; demande en ligne → « En ligne ».
                label={a.status === 'attente' ? t('publish.pending') : (a.isDemande ? t('lists.live') : t('publish.verified'))}
                color={a.status === 'attente' ? '#FCF3DF' : '#ECFDF5'}
                textColor={a.status === 'attente' ? '#8A5B12' : '#047857'}
                icon={a.status === 'attente' ? 'time' : 'checkmark-circle'}
              />
              {a.hidden && (
                <Badge label={t('lists.hidden')} color="#EEF1F5" textColor={colors.muted} icon="eye-off" />
              )}
            </View>
            {a.hidden && <Text style={styles.hiddenDesc}>{t('lists.hiddenDesc')}</Text>}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 22, fontWeight: '800', color: colors.primaryDark, paddingHorizontal: '5%', paddingVertical: spacing.md },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, marginHorizontal: '5%' },
  tab: { flex: 1, height: 48, alignItems: 'center', justifyContent: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: colors.primary },
  tabText: { fontSize: 14, color: colors.text },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
  list: { paddingHorizontal: '5%', paddingVertical: spacing.lg },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.sm, ...shadow.card },
  cardHidden: { opacity: 0.75, borderStyle: 'dashed', borderWidth: 1, borderColor: colors.border },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  route: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.muted, marginTop: 3 },
  hideBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12, backgroundColor: colors.inputBg },
  hideText: { fontSize: 12, fontWeight: '800', color: colors.muted },
  hiddenDesc: { fontSize: 12, color: colors.muted, marginTop: spacing.sm, fontStyle: 'italic' },
  // Bandeau invité (demandes publiées sans compte)
  guestBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md,
  },
  guestBannerText: { flex: 1, fontSize: 12.5, color: colors.text, lineHeight: 18 },
  guestBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1.5, borderColor: colors.primary, marginTop: spacing.sm, marginBottom: spacing.lg,
  },
  guestBtnText: { color: colors.primary, fontWeight: '800', fontSize: 14 },
});
