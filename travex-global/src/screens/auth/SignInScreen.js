import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme/theme';
import Logo from '../../components/Logo';
import { Input, Button } from '../../components/common';
import { signIn, signInWithGoogle } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';

export default function SignInScreen({ navigation }) {
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { user } = await signIn({ email, password });
      if (!user) throw new Error('Compte introuvable.');
      setUser(user);
    } catch (e) {
      Alert.alert('Connexion impossible', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const res = await signInWithGoogle();
      if (res.needsFinalize) {
        // Flux reproduit depuis Treliko : finaliser l'inscription Google
        navigation.navigate('FinalizeSignup', { partial: res.partial });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryDark} />
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginTop: spacing.xxl, marginBottom: spacing.xl }}>
          <Logo width={210} height={95} showText={false} />
        </View>

        <Text style={styles.welcome}>Bienvenue !</Text>
        <Text style={styles.subtitle}>
          Veuillez vous connecter afin d’entrer en relation avec des voyageurs et gérer
          efficacement votre espace de bagages.
        </Text>

        <Input
          label="Adresse e-mail"
          icon="mail-outline"
          placeholder="votre.email@exemple.fr"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Input
          label="Mot de passe"
          icon="lock-closed-outline"
          placeholder="Entrez votre mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
          onRightPress={() => setShowPassword((v) => !v)}
        />

        <TouchableOpacity style={styles.forgot}>
          <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
        </TouchableOpacity>

        <Button title="Se connecter" icon="log-in-outline" onPress={handleLogin} loading={loading} />

        <View style={styles.orRow}>
          <View style={styles.line} />
          <Text style={styles.or}>OU</Text>
          <View style={styles.line} />
        </View>

        <Button
          title="Se connecter avec Google"
          variant="outline"
          icon="logo-google"
          onPress={handleGoogle}
          disabled={loading}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  back: { alignSelf: 'flex-start' },
  welcome: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
  subtitle: {
    fontSize: 14, color: colors.muted, textAlign: 'center',
    lineHeight: 21, marginVertical: spacing.lg,
  },
  forgot: { alignSelf: 'flex-end', marginBottom: spacing.lg },
  forgotText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  orRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.xl },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  or: { marginHorizontal: spacing.lg, color: colors.muted, fontWeight: '600' },
});
