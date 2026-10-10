import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow, surface } from '../theme/theme';
import { isoToFr, money, kg } from '../utils/format';
import { MODE_META } from '../utils/modes';

// Carte d'un départ (style annonce de site web)
export default function TripCard({ trip, onPress }) {
  const pct = trip.capacityKg ? Math.min(100, (trip.bookedKg / trip.capacityKg) * 100) : 0;
  const dates = `${isoToFr(trip.date)}${trip.arrivalDate ? ` → ${isoToFr(trip.arrivalDate)}` : ''}`;
  const mode = MODE_META[trip.transport] || MODE_META.Avion;
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.card}>
      <View style={styles.topRow}>
        <View style={[styles.modePill, { backgroundColor: mode.color + '18' }]}>
          <Ionicons name={mode.icon} size={14} color={mode.color} />
          <Text style={[styles.modeText, { color: mode.color }]}>{trip.transport}</Text>
        </View>
        <Text style={styles.dates}>{dates}</Text>
      </View>

      <View style={styles.route}>
        <Text style={styles.city} numberOfLines={1}>{trip.from}</Text>
        <Ionicons name="arrow-forward" size={18} color={colors.accent} />
        <Text style={styles.city} numberOfLines={1}>{trip.to}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.price}>{money(trip.pricePerKg)} / kg</Text>
        <Text style={styles.remaining}>{kg(trip.remainingKg)} kg restants</Text>
      </View>
      <View style={styles.bar}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footText}>Voir et réserver</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: surface.card, borderRadius: radius.md, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  modePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14 },
  modeText: { fontSize: 12, fontWeight: '800' },
  dates: { fontSize: 12, color: colors.muted, flexShrink: 1, textAlign: 'right' },
  route: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.md },
  city: { fontSize: 18, fontWeight: '800', color: colors.primaryDark, flexShrink: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  price: { fontSize: 15, fontWeight: '800', color: colors.accent },
  remaining: { fontSize: 13, color: colors.text, fontWeight: '600' },
  bar: { height: 6, borderRadius: 3, backgroundColor: colors.border, marginTop: spacing.sm, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: colors.accent, borderRadius: 3 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: spacing.md, gap: 2 },
  footText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
