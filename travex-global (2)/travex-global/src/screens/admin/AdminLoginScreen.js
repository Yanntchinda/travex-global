import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme/theme';
import { ScreenHeader, Input, Button } from '../../components/common';
import { signIn, ADMIN_CREDENTIALS } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function AdminLoginScreen({ navigation }) {
  const { setUser } = useAuth();
  const { t, setLang } = useLanguage();
  const [email, setEmail] = useState(ADMIN_CREDENTIALS.email);
  const [password, setPassword] = useState(ADMIN_CREDENTIALS.password);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const { user } = await signIn({ email, password });
      if (user.role !== 'admin') throw new Error(t('admin.token'));
      setUser(user);
      // L'espace administrateur est forcé en anglais (tout le site traduit).
      setLang('en');
      navigation.replace('Admin');
    } catch (e) {
      setError(e.message);
      Alert.alert(t('admin.access'), e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={t('admin.loginTitle')} onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="shield-checkmark" size={40} color={colors.primary} />
        </View>
        <Text style={styles.title}>{t('admin.area')}</Text>
        <Text style={styles.sub}>{t('admin.sub')}</Text>

        <Input label={t('auth.email')} icon="mail-outline" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Input label={t('auth.password')} icon="lock-closed-outline" value={password} onChangeText={setPassword} secureTextEntry />

        <Button title={t('auth.loginBtn')} onPress={submit} loading={loading} />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, alignItems: 'stretch' },
  iconWrap: { alignSelf: 'center', width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginVertical: spacing.xl },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center' },
  sub: { fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: spacing.xl, lineHeight: 21 },
  errorText: {
    color: colors.red, backgroundColor: '#FDECEC', borderRadius: 12,
    padding: spacing.md, marginTop: spacing.md, textAlign: 'center', fontSize: 14, fontWeight: '600',
  },
});
