import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { ScreenHeader, EmptyState, Button } from '../../components/common';
import { getNotifications, markNotificationsRead } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import AppModal from '../../components/AppModal';

export default function NotificationsScreen({ navigation }) {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null); // notification ouverte (clic)

  const load = useCallback(async () => {
    if (!user) return;
    const list = await getNotifications();
    setItems(list);
  }, [user]);
  useEffect(() => { load(); }, [load]);

  const openAllRead = async () => {
    await markNotificationsRead();
    load();
  };

  const openNotif = async (n) => {
    setSelected(n);
    if (!n.read) {
      await markNotificationsRead();
      load();
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title={t('notif.title')} onBack={() => navigation.goBack()} />
        <EmptyState icon="notifications-outline" title={t('notif.title')} subtitle={t('notif.login')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={t('notif.title')} onBack={() => navigation.goBack()}
        rightIcon="checkmark-done-outline" onRight={openAllRead} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {items.length === 0 && (
          <EmptyState icon="notifications-outline" title={t('notif.empty')} subtitle={t('notif.emptyDesc')} />
        )}
        {items.map((n) => (
          <TouchableOpacity key={n.id} style={[styles.item, !n.read && styles.itemUnread]} onPress={() => openNotif(n)} activeOpacity={0.85}>
            <View style={styles.icon}>
              <Ionicons name={n.icon} size={20} color={n.read ? colors.muted : colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.title}>{n['title_' + lang]}</Text>
              <Text style={styles.body} numberOfLines={2}>{n['body_' + lang]}</Text>
              <Text style={styles.time}>{n.time}</Text>
            </View>
            {!n.read && <View style={styles.dot} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Modale de consultation d'une notification */}
      <AppModal transparent visible={!!selected} animationType="fade" onRequestClose={() => setSelected(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelected(null)}>
          <View style={styles.detailCard}>
            <View style={styles.detailIcon}>
              <Ionicons name={selected?.icon} size={26} color={colors.primary} />
            </View>
            <Text style={styles.detailTitle}>{selected?.['title_' + lang]}</Text>
            <Text style={styles.detailBody}>{selected?.['body_' + lang]}</Text>
            <Text style={styles.detailTime}>{selected?.time}</Text>
            <Button title={t('demand.close')} variant="outline" onPress={() => setSelected(null)} style={{ marginTop: spacing.lg, width: '100%' }} />
          </View>
        </TouchableOpacity>
      </AppModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: '5%', paddingVertical: spacing.lg },
  item: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  itemUnread: { borderLeftWidth: 4, borderLeftColor: colors.accent },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  body: { fontSize: 13, color: colors.muted, marginTop: 3, lineHeight: 19 },
  time: { fontSize: 12, color: colors.muted, marginTop: 4 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.accent, marginLeft: spacing.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  detailCard: { width: '100%', maxWidth: 380, backgroundColor: colors.card, borderRadius: 24, padding: spacing.xl, alignItems: 'center' },
  detailIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  detailTitle: { fontSize: 18, fontWeight: '900', color: colors.text, marginTop: spacing.md, textAlign: 'center' },
  detailBody: { fontSize: 14, color: colors.text, marginTop: spacing.sm, lineHeight: 21, textAlign: 'center' },
  detailTime: { fontSize: 12, color: colors.muted, marginTop: spacing.sm },
});
