import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, surface } from '../theme/theme';
import { ScreenHeader, Input, Button } from '../components/common';
import { adminLogin } from '../services/store';

// Page de connexion administrateur : identifiants uniquement, aucune autre option.
export default function AdminLoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await adminLogin(email, password);
      navigation.replace('Admin');
    } catch (e) {
      if (Platform.OS === 'web') window.alert(e.message);
      else Alert.alert('Connexion impossible', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Connexion administrateur" onBack={() => navigation.goBack()} />
      <View style={styles.box}>
        <View style={styles.iconWrap}>
          <Ionicons name="shield-checkmark-outline" size={34} color={colors.primary} />
        </View>
        <Text style={styles.help}>Accès réservé à TRAVEX GLOBAL.</Text>
        <Input label="Identifiant (e-mail)" icon="mail-outline" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Input label="Mot de passe" icon="lock-closed-outline" value={password} onChangeText={setPassword} secureTextEntry onSubmitEditing={submit} />
        <Button title="Se connecter" icon="log-in-outline" loading={busy} onPress={submit} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: surface.bg },
  box: { padding: spacing.xl },
  iconWrap: {
    width: 70, height: 70, borderRadius: 35, backgroundColor: surface.primaryLight,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: spacing.md,
  },
  help: { textAlign: 'center', color: colors.muted, marginBottom: spacing.xl, lineHeight: 20 },
});
