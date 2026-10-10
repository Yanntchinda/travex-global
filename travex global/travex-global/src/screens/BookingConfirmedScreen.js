import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow, surface } from '../theme/theme';
import { Button } from '../components/common';
import { isoToFr, money, kg } from '../utils/format';

export default function BookingConfirmedScreen({ route, navigation }) {
  const { booking, trip } = route.params;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.checkWrap}>
          <Ionicons name="checkmark" size={38} color={colors.white} />
        </View>
        <Text style={styles.title}>Réservation enregistrée</Text>
        <Text style={styles.sub}>
          Gardez bien votre référence. TRAVEX GLOBAL vous contactera au {booking.phone} pour la confirmation.
        </Text>

        <View style={styles.refBox}>
          <Text style={styles.refLabel}>Votre référence</Text>
          <Text style={styles.ref} selectable>{booking.ref}</Text>
        </View>

        <View style={styles.card}>
          <Row label="Trajet" value={`${trip.from} → ${trip.to}`} />
          <Row label="Date de départ" value={isoToFr(trip.date)} />
          <Row label="Poids réservé" value={`${kg(booking.kg)} kg`} />
          <Row label="Tarif" value={`${money(booking.pricePerKg)} / kg`} />
          <Row label="Total estimé" value={money(booking.total)} strong last />
        </View>

        <Button title="Retour aux départs" icon="home-outline" onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })} style={{ marginTop: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, strong, last }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, strong && { color: colors.accent, fontSize: 16 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: surface.bg },
  content: { padding: spacing.xl, paddingBottom: 40, alignItems: 'stretch' },
  checkWrap: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: colors.green,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: spacing.lg,
  },
  title: { fontSize: 22, fontWeight: '900', color: colors.primaryDark, textAlign: 'center', marginTop: spacing.lg },
  sub: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21, marginTop: spacing.sm },
  refBox: {
    backgroundColor: surface.primary, borderRadius: radius.lg, padding: spacing.xl, marginTop: spacing.xl, alignItems: 'center',
  },
  refLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '700' },
  ref: { color: colors.white, fontSize: 30, fontWeight: '900', letterSpacing: 2, marginTop: 6 },
  card: {
    backgroundColor: surface.card, borderRadius: radius.md, marginTop: spacing.lg, paddingHorizontal: spacing.lg,
    borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { color: colors.muted, fontSize: 14 },
  rowValue: { color: colors.text, fontWeight: '700', fontSize: 14, flexShrink: 1, textAlign: 'right' },
});
