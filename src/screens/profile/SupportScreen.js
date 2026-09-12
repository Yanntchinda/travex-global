import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { ScreenHeader } from '../../components/common';

const CHANNELS = [
  { icon: 'call-outline', title: 'Support téléphonique', value: '+237 658 65 69 49' },
  { icon: 'mail-outline', title: 'Support par e-mail', value: 'support@travexglobal.com' },
  { icon: 'logo-whatsapp', title: 'WhatsApp', value: 'Messagerie instantanée', green: true },
  { icon: 'logo-whatsapp', title: 'Rejoindre le groupe WhatsApp', value: 'Restez à jour avec notre communauté', green: true },
];

export default function SupportScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Contacter le support" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Ionicons name="headset-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Support disponible 24/7</Text>
          </View>
          <Text style={styles.subtitle}>Notre équipe est prête à vous aider avec toutes vos questions ou problèmes.</Text>

          {CHANNELS.map((c, i) => (
            <TouchableOpacity key={i} style={styles.channel} onPress={() => Alert.alert(c.title, c.value)}>
              <View style={[styles.iconBox, c.green && { backgroundColor: '#E7F6EE' }]}>
                <Ionicons name={c.icon} size={22} color={c.green ? colors.green : colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.channelTitle}>{c.title}</Text>
                <Text style={styles.channelValue}>{c.value}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Heures de support</Text>
          </View>
          <View style={styles.hoursRow}>
            <Ionicons name="time-outline" size={18} color={colors.muted} />
            <Text style={styles.hours}>Lundi - Vendredi : 08:00 - 20:00</Text>
          </View>
          <View style={styles.hoursRow}>
            <Ionicons name="time-outline" size={18} color={colors.muted} />
            <Text style={styles.hours}>Samedi - Dimanche : 09:00 - 17:00</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: '5%', paddingVertical: spacing.lg },
  section: { backgroundColor: colors.inputBg, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, ...shadow.card },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.primaryDark, marginLeft: 8 },
  subtitle: { fontSize: 14, color: colors.muted, lineHeight: 21, marginBottom: spacing.md },
  channel: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.sm,
  },
  iconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.inputBg, alignItems: 'center', justifyContent: 'center' },
  channelTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  channelValue: { fontSize: 13, color: colors.muted, marginTop: 3 },
  hoursRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  hours: { marginLeft: spacing.sm, fontSize: 14, color: colors.text },
});
