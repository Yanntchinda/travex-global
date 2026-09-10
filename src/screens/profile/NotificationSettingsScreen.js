import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { ScreenHeader } from '../../components/common';

export default function NotificationSettingsScreen({ navigation }) {
  const [push, setPush] = useState(true);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Paramètres de notification" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Ionicons name="notifications" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>
          <View style={styles.rowCard}>
            <Ionicons name="notifications-outline" size={24} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.rowTitle}>Notifications Push</Text>
              <Text style={styles.rowDesc}>Recevoir des notifications push pour les mises à jour et les alertes.</Text>
            </View>
            <Switch value={push} onValueChange={setPush} trackColor={{ true: colors.primary, false: colors.border }} thumbColor={colors.white} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: '5%', paddingVertical: spacing.lg },
  section: {
    backgroundColor: colors.inputBg, borderRadius: radius.lg, padding: spacing.lg, ...shadow.card,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.primaryDark, marginLeft: 8 },
  rowCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    borderRadius: radius.md, padding: spacing.lg,
  },
  rowTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  rowDesc: { fontSize: 13, color: colors.muted, marginTop: 4, lineHeight: 19 },
});
