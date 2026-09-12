import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { ScreenHeader, EmptyState } from '../../components/common';
import { getPayments } from '../../services/supabase';

const fmtDate = (at) => new Date(at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

// « Vos paiements » — historique des paiements de l'utilisateur (expéditeur).
// Phase 1 : chaque réservation de colis est enregistrée dans le registre local
// (aucune API de paiement). Phase 2 : mêmes écritures, émises par le backend +
// les passerelles réelles (Mobile Money, carte…).
export default function PaymentsHistoryScreen({ navigation }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    const load = () => { getPayments().then(setItems).catch(() => setItems([])); };
    load();
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation]);

  const total = (items || []).reduce((s, p) => s + p.amount, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Vos paiements" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Résumé */}
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Total payé</Text>
          <Text style={styles.summaryAmount}>{total} €</Text>
          <Text style={styles.summarySub}>
            {(items || []).length} paiement{(items || []).length > 1 ? 's' : ''} · Réservations de colis
          </Text>
        </View>

        {/* Fonctionnement sans API de paiement */}
        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.noteText}>
            Phase 1 (actuelle) : les paiements sont simulés dans l’app — aucun argent réel ne circule. Chaque réservation crée automatiquement une entrée ici. Les moyens de paiement réels (Mobile Money, carte bancaire) seront intégrés en phase 2 via un serveur sécurisé, sans rien changer à cet écran.
          </Text>
        </View>

        {/* Historique */}
        {items && items.length === 0 && (
          <EmptyState icon="card-outline" title="Aucun paiement" subtitle="Vos paiements de réservation apparaîtront ici." />
        )}
        {(items || []).map((p) => (
          <View key={p.id} style={styles.row}>
            <View style={styles.iconBox}>
              <Ionicons name="card-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.rowLabel} numberOfLines={1}>{p.label}</Text>
              <Text style={styles.rowSub}>Réf. {p.ref} · {p.kg} kg · {fmtDate(p.at)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.rowAmount}>-{p.amount} €</Text>
              <View style={[styles.chip, styles.chipPaid]}>
                <Ionicons name="checkmark-circle" size={11} color={colors.green} />
                <Text style={[styles.chipText, { color: colors.green }]}>Payé</Text>
              </View>
            </View>
          </View>
        ))}
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
  summarySub: { fontSize: 12, color: colors.muted, marginTop: 4 },
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
  rowAmount: { fontSize: 15, fontWeight: '900', color: colors.text },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 4 },
  chipPaid: { backgroundColor: colors.green + '1A' },
  chipText: { fontSize: 11, fontWeight: '800' },
});
