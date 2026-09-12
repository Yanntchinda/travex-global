import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { ScreenHeader } from '../../components/common';
import { getPaymentMethods } from '../../services/supabase';

export default function PaymentScreen({ navigation }) {
  const [count, setCount] = useState(0);

  // Nombre de modes enregistrés (affiché sur l'option « Ajouter… »).
  useEffect(() => {
    const load = () => { getPaymentMethods().then((l) => setCount((l || []).length)).catch(() => {}); };
    load();
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation]);

  const OPTIONS = [
    {
      icon: 'card-outline',
      title: 'Ajouter un moyen de paiement',
      desc: 'Orange Money, MTN MoMo, PayPal, carte bancaire — enregistrez vos références (' + count + ' mode' + (count > 1 ? 's' : '') + ' enregistré' + (count > 1 ? 's' : '') + ')',
      go: 'AddPaymentMethod',
    },
    { icon: 'cash-outline', title: 'Vos paiements', desc: 'Consulter l\u2019historique de vos paiements et reçus', go: 'PaymentsHistory' },
    { icon: 'wallet-outline', title: 'Vos gains', desc: 'Suivre vos gains de transport (KiloPass)', go: 'Earnings' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Gestion des paiements" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Options de paiement</Text>
        {OPTIONS.map((o, i) => (
          <TouchableOpacity key={i} style={styles.option} onPress={() => navigation.navigate(o.go)}>
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
            Vos références s’affichent sur vos annonces pour indiquer aux expéditeurs comment vous payer. Phase 1 : comptabilité virtuelle — les comptes seront vérifiés en phase 2 via un serveur sécurisé.
          </Text>
        </View>
      </ScrollView>
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
});
