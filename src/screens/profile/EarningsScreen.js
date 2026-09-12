import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { ScreenHeader, EmptyState } from '../../components/common';
import { getEarnings } from '../../services/supabase';
import AppModal from '../../components/AppModal';

const fmtDate = (at) => new Date(at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

// « Vos gains » — revenus du voyageur (KiloPass).
// Un gain n'est DISPONIBLE qu'après la remise du colis (PIN saisi) ; avant ça
// il reste « en attente » (fonds séquestrés). Phase 1 : simulation locale,
// zéro API — le retrait réel (Mobile Money) arrivera en phase 2.
export default function EarningsScreen({ navigation }) {
  const [items, setItems] = useState(null);
  // Modale de retrait (Alert.alert est un no-op sur le web : vraie modale in-app).
  const [modal, setModal] = useState(null); // { title, lines: [] }

  useEffect(() => {
    const load = () => { getEarnings().then(setItems).catch(() => setItems([])); };
    load();
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation]);

  const available = (items || []).filter((e) => e.status === 'available').reduce((s, e) => s + e.amount, 0);
  const pending = (items || []).filter((e) => e.status === 'pending').reduce((s, e) => s + e.amount, 0);
  const total = available + pending;

  const onWithdraw = () => {
    if (available <= 0) {
      setModal({
        title: 'Retrait impossible',
        lines: [
          'Aucun gain disponible pour le moment.',
          'Un gain devient disponible après la remise du colis (code PIN validé par le destinataire).',
        ],
      });
      return;
    }
    setModal({
      title: `Retirer ${available} €`,
      lines: [
        'Phase 1 (actuelle) : le retrait est simulé — aucun argent réel ne circule.',
        'En phase 2, vous recevrez vos gains directement sur votre compte Mobile Money (Orange Money, MTN MoMo) ou bancaire, dès la remise du colis confirmée par le code PIN.',
      ],
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Vos gains" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Résumé */}
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Solde disponible</Text>
          <Text style={styles.summaryAmount}>{available} €</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCell}>
              <Text style={styles.cellValue}>{pending} €</Text>
              <Text style={styles.cellLabel}>En attente</Text>
            </View>
            <View style={styles.cellDivider} />
            <View style={styles.summaryCell}>
              <Text style={styles.cellValue}>{total} €</Text>
              <Text style={styles.cellLabel}>Total gagné</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.withdrawBtn} onPress={onWithdraw} activeOpacity={0.85}>
            <Ionicons name="download-outline" size={17} color="#fff" />
            <Text style={styles.withdrawText}>Retirer mes gains</Text>
          </TouchableOpacity>
        </View>

        {/* Fonctionnement */}
        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.noteText}>
            Comment ça marche : quand vous transportez un colis (KiloPass), le paiement de l’expéditeur est mis de côté. Votre gain est libéré et devient disponible dès la remise du colis (code PIN validé). Phase 1 : simulation locale, aucun argent réel — le versement Mobile Money arrivera en phase 2.
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

      {/* Modale retrait (explication phase 1 / phase 2) */}
      <AppModal transparent visible={!!modal} animationType="fade" onRequestClose={() => setModal(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModal(null)}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}><Ionicons name="wallet-outline" size={24} color={colors.primary} /></View>
            <Text style={styles.modalTitle}>{modal?.title}</Text>
            {(modal?.lines || []).map((l, i) => (
              <Text key={i} style={styles.modalLine}>{l}</Text>
            ))}
            <TouchableOpacity style={styles.modalBtn} onPress={() => setModal(null)} activeOpacity={0.85}>
              <Text style={styles.modalBtnText}>J’ai compris</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </AppModal>
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
  summaryAmount: { fontSize: 34, fontWeight: '900', color: colors.green, marginTop: 4 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.lg },
  summaryCell: { alignItems: 'center', paddingHorizontal: spacing.xl },
  cellValue: { fontSize: 16, fontWeight: '900', color: colors.text },
  cellLabel: { fontSize: 11, color: colors.muted, marginTop: 2 },
  cellDivider: { width: 1, height: 28, backgroundColor: colors.border },
  withdrawBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 13, paddingHorizontal: spacing.xl, width: '100%',
  },
  withdrawText: { color: '#fff', fontSize: 15, fontWeight: '800' },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 340, backgroundColor: colors.card, borderRadius: 24, padding: 24, alignItems: 'center', ...shadow.card },
  modalIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 17, fontWeight: '900', color: colors.text, textAlign: 'center' },
  modalLine: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 8, lineHeight: 19 },
  modalBtn: { marginTop: 18, backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 28, width: '100%', alignItems: 'center' },
  modalBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
