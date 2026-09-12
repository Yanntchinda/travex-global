import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { EmptyState, Badge } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { fetchUserAnnouncements, setAnnouncementHidden } from '../../services/supabase';

export default function AnnoncesScreen({ navigation }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [tab, setTab] = useState('attente');
  const [items, setItems] = useState([]);

  const load = useCallback(async () => {
    const list = await fetchUserAnnouncements(user?.email);
    setItems(list);
  }, [user?.email]);

  // Masque / réaffiche une annonce — action réservée au propriétaire (ici).
  const toggleHidden = async (a) => {
    await setAnnouncementHidden(a.id, !a.hidden);
    load();
  };

  // Recharge à chaque retour sur l'onglet : la publication apparaît immédiatement.
  useEffect(() => {
    if (!user) return;
    load();
    const unsub = navigation.addListener('focus', () => load());
    return unsub;
  }, [load, user, navigation]);

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Text style={styles.title}>{t('lists.mine')}</Text>
        <EmptyState icon="list-outline" title={t('lists.empty')} subtitle={t('lists.emptyDesc')} />
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
                label={a.status === 'attente' ? t('publish.pending') : t('publish.verified')}
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
});
