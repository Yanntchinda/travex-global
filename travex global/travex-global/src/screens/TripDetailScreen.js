import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useLive from '../utils/useLive';
import { colors, spacing, radius, shadow, surface } from '../theme/theme';
import { ScreenHeader, Button, Loading, EmptyState } from '../components/common';
import CapacityGauge from '../components/CapacityGauge';
import Slider from '../components/Slider';
import { getTrip } from '../services/store';
import { isoToFr, money, kg } from '../utils/format';
import { MODE_META } from '../utils/modes';

export default function TripDetailScreen({ route, navigation }) {
  const { tripId } = route.params;
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selKg, setSelKg] = useState(1);

  // Recharge le départ à chaque changement (place réservée par un autre client, etc.)
  // sans toucher au poids saisi : il est seulement borné au reste disponible (voir safeKg).
  const loadTrip = useCallback(async () => {
    const t = await getTrip(tripId);
    setTrip(t);
    setLoading(false);
  }, [tripId]);
  useLive(loadTrip);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Départ" onBack={() => navigation.goBack()} />
        <Loading />
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Départ" onBack={() => navigation.goBack()} />
        <EmptyState icon="alert-circle-outline" title="Départ introuvable" subtitle="Il a peut-être été retiré." />
      </SafeAreaView>
    );
  }

  const full = trip.remainingKg <= 0;
  const maxKg = Math.max(1, trip.remainingKg);
  const safeKg = full ? 0 : Math.min(Math.max(1, selKg), maxKg);
  const total = Math.round(safeKg * trip.pricePerKg * 100) / 100;
  const mode = MODE_META[trip.transport] || MODE_META.Avion;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Détail du départ" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.routeCard}>
          <View style={[styles.modePill, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
            <Ionicons name={mode.icon} size={14} color={colors.white} />
            <Text style={styles.modeText}>{trip.transport}</Text>
          </View>
          <Text style={styles.city}>{trip.from}</Text>
          <Ionicons name="arrow-down" size={22} color={colors.accent} style={{ marginVertical: 4 }} />
          <Text style={styles.city}>{trip.to}</Text>
        </View>

        <View style={styles.infoCard}>
          <Info icon="calendar-outline" label="Date de départ" value={isoToFr(trip.date)} />
          {!!trip.arrivalDate && <Info icon="flag-outline" label="Date d’arrivée" value={isoToFr(trip.arrivalDate)} />}
          <Info icon="pricetag-outline" label="Tarif" value={`${money(trip.pricePerKg)} / kg`} last />
        </View>

        {/* Estimateur interactif : jauge + curseur + total */}
        <View style={styles.estimator}>
          <Text style={styles.estTitle}>Choisissez le poids de votre colis</Text>
          <CapacityGauge totalKg={trip.capacityKg} bookedKg={trip.bookedKg} />
          {!full ? (
            <>
              <View style={styles.estDivider} />
              <View style={styles.estRow}>
                <Text style={styles.estLabel}>Poids à réserver</Text>
                <Text style={styles.estKg}>{kg(safeKg)} kg</Text>
              </View>
              <Slider min={1} max={maxKg} value={safeKg} onChange={setSelKg} fillColor={colors.primary} thumbColor={colors.primary} />
              <View style={styles.estRow}>
                <Text style={styles.estLabel}>Total estimé</Text>
                <Text style={styles.estTotal}>{money(total)}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.full}>Ce départ est complet.</Text>
          )}
        </View>

        {!!trip.description && (
          <View style={styles.descCard}>
            <Text style={styles.descTitle}>Informations</Text>
            <Text style={styles.descText}>{trip.description}</Text>
          </View>
        )}
      </ScrollView>

      {/* Barre de réservation */}
      <View style={styles.actionBar}>
        <View>
          <Text style={styles.barLabel}>{kg(safeKg)} kg · total</Text>
          <Text style={styles.barTotal}>{money(total)}</Text>
        </View>
        <Button
          title={full ? 'Complet' : 'Réserver'}
          icon={full ? undefined : 'cube-outline'}
          disabled={full}
          onPress={() => navigation.navigate('Book', { tripId: trip.id, kg: safeKg })}
          style={{ flex: 1, marginLeft: spacing.lg }}
        />
      </View>
    </SafeAreaView>
  );
}

function Info({ icon, label, value, last }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoBorder]}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: surface.bg },
  content: { padding: spacing.lg, paddingBottom: 130 },
  routeCard: { backgroundColor: surface.primary, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center' },
  modePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, marginBottom: spacing.md },
  modeText: { color: colors.white, fontSize: 12, fontWeight: '800' },
  city: { color: colors.white, fontSize: 24, fontWeight: '900' },
  infoCard: {
    backgroundColor: surface.card, borderRadius: radius.md, marginTop: spacing.lg,
    paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 10 },
  infoBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { flex: 1, color: colors.muted, fontSize: 14 },
  infoValue: { color: colors.text, fontWeight: '700', fontSize: 14, textAlign: 'right' },
  estimator: {
    backgroundColor: surface.card, borderRadius: radius.md, padding: spacing.lg, marginTop: spacing.md,
    borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  estTitle: { fontSize: 15, fontWeight: '800', color: colors.primaryDark, marginBottom: spacing.md },
  estDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  estRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  estLabel: { color: colors.muted, fontSize: 14 },
  estKg: { fontSize: 18, fontWeight: '900', color: colors.text },
  estTotal: { fontSize: 20, fontWeight: '900', color: colors.accent },
  full: { color: colors.red, fontWeight: '700', marginTop: spacing.md, textAlign: 'center' },
  descCard: {
    backgroundColor: surface.card, borderRadius: radius.md, padding: spacing.lg, marginTop: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  descTitle: { fontWeight: '800', color: colors.primaryDark, marginBottom: 6 },
  descText: { color: colors.text, lineHeight: 21 },
  actionBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center',
    backgroundColor: surface.card, borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, ...shadow.card,
  },
  barLabel: { color: colors.muted, fontSize: 12 },
  barTotal: { color: colors.accent, fontSize: 20, fontWeight: '900' },
});
