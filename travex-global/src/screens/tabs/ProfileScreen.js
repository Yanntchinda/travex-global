import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { APP } from '../../config';

const MENU = [
  { icon: 'person-outline', label: 'Informations personnelles', screen: 'PersonalInfo' },
  { icon: 'wallet-outline', label: 'Gestion des paiements', screen: 'Payment' },
  { icon: 'notifications-outline', label: 'Notifications Push', screen: 'NotificationSettings' },
  { icon: 'language-outline', label: 'Choisir la langue', screen: 'Language' },
  { icon: 'lock-closed-outline', label: 'Paramètres de sécurité', screen: 'Security' },
  { icon: 'star-outline', label: 'Évaluation', screen: 'Ratings' },
  { icon: 'document-text-outline', label: 'Politique de confidentialité', screen: null },
  { icon: 'document-outline', label: 'Conditions générales', screen: null },
  { icon: 'bulb-outline', label: 'FAQ', screen: null },
  { icon: 'help-circle-outline', label: 'Support', screen: 'Support' },
];

export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const stats = user?.stats || { voyages: 0, demandes: 0, note: 0 };

  const handlePress = (screen) => {
    if (screen) navigation.navigate(screen);
    else Alert.alert('Bientôt disponible', 'Cette section sera ajoutée prochainement.');
  };

  const handleSignOut = () => {
    Alert.alert('Se déconnecter', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* En-tête bleu */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.gear} onPress={() => Alert.alert('Paramètres', 'Réglages rapides.')}>
          <Ionicons name="settings-outline" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.initials || 'YT'}</Text>
        </View>
        <Text style={styles.name}>{user ? `${user.firstName} ${user.lastName}` : 'yann Tchinda'}</Text>
        <Text style={styles.email}>{user?.email || 'yanntchinda813@gmail.com'}</Text>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{stats.voyages}</Text>
            <Text style={styles.statLabel}>Voyages</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{stats.demandes}</Text>
            <Text style={styles.statLabel}>Demandes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{stats.note}/5</Text>
            <Text style={styles.statLabel}>Note</Text>
          </View>
        </View>
      </View>

      {/* Bandeau compte non vérifié */}
      <View style={styles.banner}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Ionicons name="warning-outline" size={22} color="#B7791F" />
          <Text style={styles.bannerText}>Compte non vérifié.</Text>
        </View>
        <TouchableOpacity style={styles.verifyBtn} onPress={() => Alert.alert('Vérification', 'La vérification d\u2019identité sera disponible prochainement.')}>
          <Text style={styles.verifyText}>Vérifier</Text>
        </TouchableOpacity>
      </View>

      {/* Menu */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.menu}>
        {MENU.map((m, i) => (
          <TouchableOpacity key={i} style={styles.menuRow} onPress={() => handlePress(m.screen)}>
            <Ionicons name={m.icon} size={22} color={colors.primary} />
            <Text style={styles.menuLabel}>{m.label}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={[styles.menuRow, { marginTop: spacing.sm }]} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={22} color={colors.red} />
          <Text style={[styles.menuLabel, { color: colors.red }]}>Se déconnecter</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </TouchableOpacity>

        <Text style={styles.version}>Version : {APP.version}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.primary, paddingBottom: spacing.xl, paddingTop: spacing.md,
    paddingHorizontal: spacing.lg, borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  gear: { alignSelf: 'flex-end', padding: 8 },
  avatar: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: colors.white,
    alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm,
  },
  avatarText: { color: colors.primary, fontSize: 30, fontWeight: '800' },
  name: { color: colors.white, fontSize: 20, fontWeight: '700', textAlign: 'center', marginTop: spacing.md },
  email: { color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'center', marginTop: 2 },
  stats: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  stat: { alignItems: 'center', width: 90 },
  statNum: { color: colors.white, fontWeight: '800', fontSize: 20 },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', alignSelf: 'stretch', marginVertical: 4 },
  banner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FCF3DF',
    marginHorizontal: spacing.lg, marginTop: -16, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: '#F0DFB2', zIndex: 2, ...shadow.card,
  },
  bannerText: { color: '#8A5B12', fontWeight: '600', fontSize: 14, marginLeft: 8 },
  verifyBtn: {
    backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: 8, borderRadius: 20,
  },
  verifyText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  menu: { padding: spacing.lg, paddingBottom: spacing.xxl },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    padding: spacing.lg, borderRadius: radius.md, marginBottom: spacing.sm, ...shadow.card,
  },
  menuLabel: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '600', marginLeft: spacing.lg },
  version: { textAlign: 'center', color: colors.muted, fontSize: 13, marginTop: spacing.lg },
});
