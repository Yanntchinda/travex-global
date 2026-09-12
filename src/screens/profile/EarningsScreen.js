import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { ScreenHeader, EmptyState } from '../../components/common';
import { getEarnings } from '../../services/supabase';

const fmtDate = (at) => new Date(at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

// « Vos gains » — revenus du voyageur (KiloPass). COMPTABILITÉ VIRTUELLE :
//   - En attente    = colis transportés mais pas encore remis (le paiement de
//                     l'expéditeur est séquestré jusqu'à la remise) ;
//   - Disponible    = colis remis (code PIN validé) → gain libéré ;
//   - Total gagné   = TOUT ce que vous avez gagné : disponible + en attente.
// Phase 1 : simulation locale, aucun argent réel ne circule.
export default function EarningsScreen({ navigation }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    const load = () => { getEarnings().then(setItems).catch(() => setItems([])); };
    load();
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation]);

  const available = (items || []).filter((e) => e.status === 'available').reduce((s, e) => s + e.amount, 0);
  const pending = (items || []).filter((e) => e.status === 'pending').reduce((s, e) => s + e.amount, 0);
  const total = available + pending;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Vos gains" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Résumé */}
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Total gagné</Text>
          <Text style={styles.summaryAmount}>{total} €</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCell}>
              <Text style={[styles.cellValue, { color: colors.green }]}>{available} €</Text>
              <Text style={styles.cellLabel}>Disponible{'\n'}(colis remis)</Text>
            </View>
            <View style={styles.cellDivider} />
            <View style={styles.summaryCell}>
              <Text style={[styles.cellValue, { color: colors.orange }]}>{pending} €</Text>
              <Text style={styles.cellLabel}>En attente{'\n'}(remise à venir)</Text>
            </View>
          </View>
        </View>

        {/* Fonctionnement */}
        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.noteText}>
            Comptabilité virtuelle (phase 1) — aucun argent réel ne circule.{'\n'}
            {'\n'}• « En attente » : colis transportés mais pas encore remis — le paiement de l’expéditeur reste séquestré jusqu’à la remise.
            {'\n'}• « Disponible » : colis remis (code PIN validé) — le gain est libéré.
            {'\n'}• « Total gagné » : tout ce que vous avez gagné (disponible + en attente).
          </Text>
        </View>

        {/* Historique */}
        {items && items.length === 0 && (
          <EmptyState icon="wallet-outline" title="Aucun gain" subtitle="Vos gains de transport (KiloPass) apparaîtront ici." />
        )}
        {(items || []).map((e) => {
          const ok = e.status === 'available';
          return (
            <View key={e.id} style={styles.row}>
              <View style={styles.iconBox}>
                <Ionicons name="wallet-outline" size={20} color={ok ? colors.green : colors.orange} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.rowLabel} numberOfLines={1}>{e.label}</Text>
                <Text style={styles.rowSub}>Réf. {e.ref} · {e.kg} kg · {fmtDate(e.at)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.rowAmount}>+{e.amount} €</Text>
                <View style={[styles.chip, ok ? styles.chipAvailable : styles.chipPending]}>
                  <Ionicons name={ok ? 'checkmark-circle' : 'time'} size={11} color={ok ? colors.green : colors.orange} />
                  <Text style={[styles.chipText, { color: ok ? colors.green : colors.orange }]}>
                    {ok ? 'Disponible' : 'En attente'}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: '5%', paddingVertical: spacing.lg, paddingBottom: 120 },
  summary: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.xl,
    alignItems: 'center', marginBottom: spacing.md, ...shadow.card,
  },
  summaryLabel: { fontSize: 12, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryAmount: { fontSize: 34, fontWeight: '900', color: colors.primary, marginTop: 4 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg },
  summaryCell: { alignItems: 'center', paddingHorizontal: spacing.xl },
  cellValue: { fontSize: 16, fontWeight: '900', color: colors.text },
  cellLabel: { fontSize: 11, color: colors.muted, marginTop: 2, textAlign: 'center', lineHeight: 15 },
  cellDivider: { width: 1, height: 34, backgroundColor: colors.border },
  note: {
    flexDirection: 'row', backgroundColor: colors.primaryLight,
    borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.lg,
  },
  noteText: { flex: 1, marginLeft: spacing.sm, fontSize: 13, color: colors.text, lineHeight: 19 },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, ...shadow.card,
  },
  iconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.inputBg, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  rowSub: { fontSize: 12, color: colors.muted, marginTop: 3 },
  rowAmount: { fontSize: 15, fontWeight: '900', color: colors.green },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 4 },
  chipAvailable: { backgroundColor: colors.green + '1A' },
  chipPending: { backgroundColor: colors.orange + '1A' },
  chipText: { fontSize: 11, fontWeight: '800' },
});
