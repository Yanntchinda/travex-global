import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow, surface } from '../theme/theme';
import { Button } from '../components/common';
import { LoginForm, RegisterForm } from '../components/AuthForms';
import { loginAccount, registerAccount } from '../services/store';
import { APP } from '../config';
import { LOGIN_BACKGROUND } from '../media/images';


function notify(title, msg) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

// Premier écran affiché à l'ouverture de l'application.
export default function LoginScreen({ navigation }) {
  const [tab, setTab] = useState('login');
  const [busy, setBusy] = useState(false);

  // Ouverte depuis une autre page (ex. réservation) : on y revient.
  // Ouverte au lancement de l'application : on va à l'accueil.
  const goHome = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
      goHome();
    } catch (e) {
      notify('Connexion impossible', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ImageBackground source={LOGIN_BACKGROUND} style={styles.safe} resizeMode="cover">
      <View style={[styles.overlay, { pointerEvents: 'none' }]} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.brand}>{APP.name}</Text>

        <View style={styles.card}>
          <View style={styles.segment}>
            <TouchableOpacity onPress={() => setTab('login')} style={[styles.segBtn, tab === 'login' && styles.segActive]}>
              <Text style={[styles.segText, tab === 'login' && { color: colors.white }]}>Se connecter</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setTab('register')} style={[styles.segBtn, tab === 'register' && styles.segActive]}>
              <Text style={[styles.segText, tab === 'register' && { color: colors.white }]}>Créer un compte</Text>
            </TouchableOpacity>
          </View>

          {tab === 'login'
            ? <LoginForm busy={busy} onSubmit={(v) => run(() => loginAccount(v.email, v.password))} />
            : <RegisterForm busy={busy} onSubmit={(v) => run(() => registerAccount(v))} />}
        </View>

        <Button title="Continuer sans compte" variant="outline" icon="arrow-forward" onPress={goHome} style={{ marginTop: spacing.lg }} />

        <TouchableOpacity onPress={() => navigation.navigate('AdminLogin')} style={styles.adminLink}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.white} />
          <Text style={styles.adminLinkText}>Espace administrateur</Text>
        </TouchableOpacity>
      </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: surface.primaryDark },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(12, 40, 74, 0.45)' },
  content: { padding: spacing.lg, paddingBottom: 40, flexGrow: 1, justifyContent: 'center' },
  brand: { fontSize: 24, fontWeight: '900', color: colors.white, textAlign: 'center', letterSpacing: 1, textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 6 },
  sub: { color: colors.white, textAlign: 'center', lineHeight: 20, marginTop: spacing.sm, marginBottom: spacing.lg, textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 6 },
  card: {
    backgroundColor: surface.card, borderRadius: radius.md, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  segment: { flexDirection: 'row', backgroundColor: surface.bg, borderRadius: radius.sm, padding: 4, marginBottom: spacing.lg },
  segBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  segActive: { backgroundColor: surface.primary },
  segText: { fontWeight: '700', color: colors.primary, fontSize: 14 },
  adminLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.xl, padding: spacing.sm },
  adminLinkText: { color: colors.white, fontWeight: '700', fontSize: 13, textDecorationLine: 'underline' },
});
