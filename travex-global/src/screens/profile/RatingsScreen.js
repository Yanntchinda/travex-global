import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { ScreenHeader, Stars } from '../../components/common';

export default function RatingsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Mes évaluations" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <View style={styles.avgCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="star" size={18} color={colors.primary} />
            <Text style={styles.avgTitle}>Évaluation moyenne</Text>
          </View>
          <Stars value={0} size={28} />
          <Text style={styles.avgNumber}>0.0 / 5 (0 évaluations)</Text>
        </View>

        <View style={styles.sectionHead}>
          <Ionicons name="chatbox-outline" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>Évaluations</Text>
        </View>
        <Text style={styles.empty}>Aucune évaluation pour le moment.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  avgCard: {
    backgroundColor: colors.inputBg, borderRadius: radius.lg, padding: spacing.xl,
    alignItems: 'center', marginBottom: spacing.xl, ...shadow.card,
  },
  avgTitle: { fontSize: 15, fontWeight: '700', color: colors.primaryDark, marginLeft: 8 },
  avgNumber: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.primaryDark, marginLeft: 8 },
  empty: { fontSize: 15, color: colors.text, textAlign: 'center', marginTop: spacing.lg },
});
