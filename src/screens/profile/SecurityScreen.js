import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { ScreenHeader } from '../../components/common';

const TIPS = [
  'Utilisez un mot de passe fort et unique',
  'Activez l\u2019authentification à deux facteurs',
  'Ne partagez jamais vos identifiants',
];

export default function SecurityScreen({ navigation }) {
  const [twoFA, setTwoFA] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Paramètres de sécurité" onBack={() => navigation.goBack()} rightIcon="ellipsis-horizontal" onRight={() => {}} />
      <View style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Protection du compte</Text>
          </View>

          <View style={styles.rowCard}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.rowTitle}>Authentification à deux facteurs</Text>
              <Text style={styles.rowDesc}>Ajoute une couche supplémentaire de sécurité</Text>
            </View>
            <Switch value={twoFA} onValueChange={setTwoFA} trackColor={{ true: colors.primary, false: colors.border }} thumbColor={colors.white} />
          </View>

          <TouchableOpacity style={styles.rowCard} onPress={() => Alert.alert('Mot de passe', 'Changer le mot de passe.')}>
            <Ionicons name="lock-closed" size={24} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.rowTitle}>Changer le mot de passe</Text>
              <Text style={styles.rowDesc}>Mettre à jour le mot de passe de votre compte</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Conseils de sécurité</Text>
          </View>
          {TIPS.map((t, i) => (
            <View key={i} style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.green} />
              <Text style={styles.tipText}>{t}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  section: { backgroundColor: colors.inputBg, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, ...shadow.card },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.primaryDark, marginLeft: 8 },
  rowCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.sm,
  },
  rowTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  rowDesc: { fontSize: 13, color: colors.muted, marginTop: 4, lineHeight: 19 },
  tipRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  tipText: { marginLeft: spacing.md, fontSize: 14, color: colors.text, flex: 1 },
});
