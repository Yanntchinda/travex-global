import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { ScreenHeader } from '../../components/common';
import AppModal from '../../components/AppModal';

const OPTIONS = [
  { icon: 'card-outline', title: 'Ajouter un moyen de paiement', desc: 'Ajouter une nouvelle carte de crédit, PayPal ou autres moyens de paiement' },
  { icon: 'cash-outline', title: 'Vos paiements', desc: 'Consulter l\u2019historique de vos paiements et reçus', go: 'PaymentsHistory' },
  { icon: 'wallet-outline', title: 'Vos gains', desc: 'Suivre vos gains et options de retrait', go: 'Earnings' },
];

export default function PaymentScreen({ navigation }) {
  // Modale d'explication (Alert.alert est un no-op sur le web).
  const [info, setInfo] = useState(false);

  const onOption = (o) => {
    if (o.go) { navigation.navigate(o.go); return; }
    // « Ajouter un moyen de paiement » — phase 1 : aucune API de paiement
    // intégrée, on explique le fonctionnement au lieu d'un faux formulaire.
    setInfo(true);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Gestion des paiements" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Options de paiement</Text>
        {OPTIONS.map((o, i) => (
          <TouchableOpacity key={i} style={styles.option} onPress={() => onOption(o)}>
            <View style={styles.iconBox}>
              <Ionicons name={o.icon} size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.optTitle}>{o.title}</Text>
              <Text style={styles.optDesc}>{o.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>
        ))}

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.noteText}>
            Toutes vos informations de paiement sont sécurisées et protégées par un cryptage.
          </Text>
        </View>
      </ScrollView>

      {/* Modale : ajout de moyen de paiement (explication phase 1 / phase 2) */}
      <AppModal transparent visible={info} animationType="fade" onRequestClose={() => setInfo(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setInfo(false)}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}><Ionicons name="card-outline" size={24} color={colors.primary} /></View>
            <Text style={styles.modalTitle}>Ajouter un moyen de paiement</Text>
            <Text style={styles.modalLine}>
              Phase 1 (actuelle) : les paiements sont simulés dans l’app — aucun moyen de paiement réel n’est demandé.
            </Text>
            <Text style={styles.modalLine}>
              En phase 2, vous pourrez enregistrer ici vos moyens de paiement (Mobile Money Orange/MTN, carte bancaire) via un serveur sécurisé. L’app ne stockera jamais vos données bancaires.
            </Text>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setInfo(false)} activeOpacity={0.85}>
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
  title: { fontSize: 18, fontWeight: '700', color: colors.primaryDark, marginBottom: spacing.md },
  option: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, ...shadow.card,
  },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.inputBg, alignItems: 'center', justifyContent: 'center' },
  optTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  optDesc: { fontSize: 13, color: colors.muted, marginTop: 4, lineHeight: 19 },
  note: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight,
    borderRadius: radius.md, padding: spacing.lg, marginTop: spacing.sm,
  },
  noteText: { flex: 1, marginLeft: spacing.sm, fontSize: 14, color: colors.text, lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 340, backgroundColor: colors.card, borderRadius: 24, padding: 24, alignItems: 'center', ...shadow.card },
  modalIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 17, fontWeight: '900', color: colors.text, textAlign: 'center' },
  modalLine: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 8, lineHeight: 19 },
  modalBtn: { marginTop: 18, backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 28, width: '100%', alignItems: 'center' },
  modalBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
