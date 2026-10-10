import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, surface } from '../theme/theme';
import { kg } from '../utils/format';

// Jauge de capacité : partie réservée (gris) / partie disponible (bleu)
export default function CapacityGauge({ totalKg, bookedKg }) {
  const total = Number(totalKg) || 0;
  const booked = Number(bookedKg) || 0;
  const remaining = Math.max(0, total - booked);
  const reserved = total ? Math.min(100, Math.round((booked / total) * 100)) : 0;
  return (
    <View>
      <View style={styles.track}>
        <View style={[styles.reserved, { width: `${reserved}%` }]} />
        <View style={[styles.avail, { width: `${100 - reserved}%` }]} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>{kg(total)} kg au total</Text>
        <Text style={styles.remaining}>{kg(remaining)} kg disponibles</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 10, borderRadius: 5, overflow: 'hidden', flexDirection: 'row', backgroundColor: colors.border },
  reserved: { backgroundColor: '#94A3B8' },
  avail: { backgroundColor: surface.primary },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  label: { fontSize: 12, color: colors.muted },
  remaining: { fontSize: 12, color: colors.primary, fontWeight: '800' },
});
