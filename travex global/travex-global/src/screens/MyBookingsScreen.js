import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow, surface } from '../theme/theme';
import { Button, EmptyState } from '../components/common';
import useLive from '../utils/useLive';
import { getSessionInfo, getMyBookings, BOOKING_STATUS } from '../services/store';
import { isoToFr, money, kg } from '../utils/format';

const STATUS = {
  [BOOKING_STATUS.pending]: { label: 'En attente', color: colors.orange },
  [BOOKING_STATUS.confirmed]: { label: 'Confirmée', color: colors.green },
  [BOOKING_STATUS.cancelled]: { label: 'Annulée', color: colors.red },
};

// Onglet « Réservations » : toutes les réservations du compte connecté.
export default function MyBookingsScreen({ navigation }) {
  const [loggedIn, setLoggedIn] = useState(null); // null = pas encore chargé
  const [bookings, setBookings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const info = await getSessionInfo();
    setLoggedIn(info.role === 'user');
    setBookings(info.role === 'user' ? await getMyBookings() : []);
  }, []);

  // Se met à jour seul (nouvelle réservation, confirmation par l'admin…)
  useLive(load);

  const onRefresh = async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  };

  if (loggedIn === false) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Text style={styles.title}>Mes réservations</Text>
        <View style={styles.gate}>
          <Ionicons name="receipt-outline" size={60} color={colors.primary} />
          <Text style={styles.gateTitle}>Connectez-vous pour voir vos réservations</Text>
          <Text style={styles.gateText}>Toutes vos réservations sont rattachées à votre compte.</Text>
          <Button
            title="Se connecter ou créer un compte"
            icon="log-in-outline"
            onPress={() => navigation.navigate('Login')}
            style={{ alignSelf: 'stretch', marginTop: spacing.xl }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={styles.title}>Mes réservations</Text>
        <Text style={styles.sub}>
          {bookings.length} réservation{bookings.length > 1 ? 's' : ''}
        </Text>

        {bookings.length === 0 ? (
          <EmptyState icon="receipt-outline" title="Aucune réservation" subtitle="Choisissez un départ dans Avions, Cargo ou RO-RO." />
        ) : (
          bookings.map((b) => {
            const st = STATUS[b.status] || STATUS[BOOKING_STATUS.pending];
            return (
              <View key={b.id} style={styles.card}>
                <View style={styles.head}>
                  <Text style={styles.ref}>{b.ref}</Text>
                  <View style={[styles.badge, { backgroundColor: st.color }]}>
                    <Text style={styles.badgeText}>{st.label}</Text>
                  </View>
                </View>
                <Text style={styles.route}>{b.trip ? `${b.trip.from} → ${b.trip.to}` : 'Départ supprimé'}</Text>
                {!!b.trip && (
                  <Text style={styles.meta}>{isoToFr(b.trip.date)} · {b.trip.transport}</Text>
                )}
                <View style={styles.foot}>
                  <Text style={styles.meta}>{kg(b.kg)} kg</Text>
                  <Text style={styles.total}>{money(b.total)}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: surface.bg },
  content: { padding: spacing.lg, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '900', color: colors.primaryDark, marginTop: spacing.md, paddingHorizontal: spacing.lg },
  sub: { color: colors.muted, marginTop: 2, marginBottom: spacing.md },
  card: {
    backgroundColor: surface.card, borderRadius: radius.md, padding: spacing.lg, marginTop: spacing.sm,
    borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ref: { fontWeight: '900', color: colors.primary, letterSpacing: 1 },
  route: { fontSize: 17, fontWeight: '800', color: colors.primaryDark, marginTop: 6 },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  foot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  total: { fontSize: 16, fontWeight: '900', color: colors.accent },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  gate: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, marginTop: spacing.xl },
  gateTitle: { fontSize: 20, fontWeight: '900', color: colors.primaryDark, marginTop: spacing.md, textAlign: 'center' },
  gateText: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20, marginTop: spacing.sm },
});
