import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow, surface } from '../theme/theme';
import { Input, Button } from '../components/common';
import useLive from '../utils/useLive';
import { getSessionInfo, updateProfile, logout } from '../services/store';

function notify(title, msg) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

// Page Compte : profil et déconnexion. Les réservations sont dans l’onglet « Réservations ».
export default function AccountScreen({ navigation }) {
  const [info, setInfo] = useState({ role: null });
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setInfo(await getSessionInfo());
  }, []);

  useLive(refresh);

  const doLogout = async () => {
    setBusy(true);
    try {
      await logout();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } finally {
      setBusy(false);
    }
  };

  // ---------- Administrateur ----------
  if (info.role === 'admin') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Mon compte</Text>
          <View style={styles.card}>
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={20} color={colors.white} />
            </View>
            <Text style={styles.name}>Administrateur TRAVEX</Text>
            <Text style={styles.meta}>Vous êtes connecté en tant qu’administrateur.</Text>
            <Button title="Ouvrir l’espace admin" icon="grid-outline" onPress={() => navigation.navigate('Admin')} style={{ marginTop: spacing.lg }} />
          </View>
          <Button title="Se déconnecter" variant="outline" icon="log-out-outline" loading={busy} onPress={doLogout} style={{ marginTop: spacing.md }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------- Pas de compte ----------
  const u = info.user;
  if (!u) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Mon compte</Text>
          <View style={styles.card}>
            <Ionicons name="person-circle-outline" size={56} color={colors.primary} style={{ alignSelf: 'center' }} />
            <Text style={styles.name}>Vous n’êtes pas connecté</Text>
            <Text style={styles.meta}>Connectez-vous pour réserver et retrouver vos réservations.</Text>
            <Button title="Se connecter ou créer un compte" icon="log-in-outline" onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })} style={{ marginTop: spacing.lg }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------- Client connecté ----------
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Mon compte</Text>

        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(u.firstName[0] || '') + (u.lastName[0] || '')}</Text>
          </View>
          <Text style={styles.name}>{u.firstName} {u.lastName}</Text>
          <Text style={styles.meta}>{u.email}</Text>
        </View>

        <Text style={styles.section}>Mes informations</Text>
        <ProfileForm user={u} onSaved={refresh} />

        <Button title="Se déconnecter" variant="outline" icon="log-out-outline" loading={busy} onPress={doLogout} style={{ marginTop: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileForm({ user, onSaved }) {
  const [f, setF] = useState({ firstName: user.firstName, lastName: user.lastName, phone: user.phone || '', city: user.city || '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => {
    setBusy(true);
    try {
      await updateProfile(f);
      notify('Informations enregistrées', 'Elles seront utilisées pour vos prochaines réservations.');
      onSaved();
    } catch (e) {
      notify('Enregistrement impossible', e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={styles.card}>
      <Input label="Prénom" value={f.firstName} onChangeText={set('firstName')} />
      <Input label="Nom" value={f.lastName} onChangeText={set('lastName')} />
      <Input label="Téléphone" icon="call-outline" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
      <Input label="Ville de résidence" icon="location-outline" value={f.city} onChangeText={set('city')} />
      <Button title="Enregistrer" icon="save-outline" loading={busy} onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: surface.bg },
  content: { padding: spacing.lg, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '900', color: colors.primaryDark, marginTop: spacing.md },
  card: {
    backgroundColor: surface.card, borderRadius: radius.md, padding: spacing.lg, marginTop: spacing.md,
    borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: surface.primary, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  avatarText: { color: colors.white, fontSize: 22, fontWeight: '900' },
  adminBadge: { width: 52, height: 52, borderRadius: 26, backgroundColor: surface.primaryDark, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  name: { fontSize: 18, fontWeight: '800', color: colors.primaryDark, textAlign: 'center', marginTop: spacing.md },
  meta: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 2, lineHeight: 19 },
  section: { fontSize: 16, fontWeight: '800', color: colors.primaryDark, marginTop: spacing.xl },
});
