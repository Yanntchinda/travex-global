import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { ScreenHeader, Input, Button } from '../../components/common';
import PhotoPicker from '../../components/PhotoPicker';
import { registerUser } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function RegisterScreen({ navigation }) {
  const { setUser } = useAuth();
  const { t } = useLanguage();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cniPhoto, setCniPhoto] = useState(null);
  const [cniSelfie, setCniSelfie] = useState(null);
  const [accepted, setAccepted] = useState(true);
  const [loading, setLoading] = useState(false);

  const fillDemo = () => {
    setFirstName('Jean');
    setLastName('Dupont');
    setLocation('Douala');
    setPhone('+237 690 00 00 00');
    setEmail('jean.dupont@example.com');
    setPassword('demo1234');
    setCniPhoto('https://via.placeholder.com/200');
    setCniSelfie('https://via.placeholder.com/200');
  };

  const submit = async () => {
    if (!firstName || !lastName || !email || !password || !location || !phone) {
      Alert.alert('Champs requis', 'Veuillez remplir tous les champs obligatoires (r\u00e9f\u00e9rences).');
      return;
    }
    if (!cniPhoto || !cniSelfie) {
      Alert.alert(t('register.identity'), 'Ajoutez votre photo de CNI et la photo de vous tenant votre CNI.');
      return;
    }
    if (!accepted) {
      Alert.alert('Conditions', 'Veuillez accepter les conditions d\u2019utilisation.');
      return;
    }
    setLoading(true);
    try {
      const user = await registerUser({ firstName, lastName, location, phone, email, password, cniPhoto, cniSelfie });
      setUser(user);
      // Après inscription réussie : revenir aux onglets principaux (vider la pile de navigation).
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={t('register.title')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.introBox}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.accent} />
          <Text style={styles.introText}>{t('register.intro')}</Text>
        </View>

        <Text style={styles.section}>{t('register.references')}</Text>
        <Input label={t('register.firstName')} icon="person-outline" value={firstName} onChangeText={setFirstName} />
        <Input label={t('register.lastName')} icon="person-outline" value={lastName} onChangeText={setLastName} />
        <Input label={t('register.location')} icon="location-outline" value={location} onChangeText={setLocation} />
        <Input label={t('register.phone')} icon="call-outline" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Input label={t('auth.email')} icon="mail-outline" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Input label={t('auth.password')} icon="lock-closed-outline" value={password} onChangeText={setPassword} secureTextEntry />

        <Text style={styles.section}>{t('register.identity')}</Text>
        <PhotoPicker
          label={t('register.cni')}
          value={cniPhoto}
          onChange={setCniPhoto}
          placeholder="Ajouter la photo de la CNI"
          hint="Face recto de votre carte d\u2019identit\u00e9"
        />
        <PhotoPicker
          label={t('register.cniSelfie')}
          value={cniSelfie}
          onChange={setCniSelfie}
          placeholder="Ajouter la photo avec votre CNI"
          hint="Visage + CNI visibles pour la v\u00e9rification"
        />

        <TouchableOpacity style={styles.checkRow} onPress={() => setAccepted((v) => !v)} activeOpacity={0.8}>
          <Ionicons name={accepted ? 'checkbox' : 'square-outline'} size={22} color={accepted ? colors.primary : colors.muted} />
          <Text style={styles.checkText}>
            {t('register.conditions')}
          </Text>
        </TouchableOpacity>

        <Button title={t('register.submit')} onPress={submit} loading={loading} style={{ marginTop: spacing.md }} />
        <TouchableOpacity style={styles.demoBtn} onPress={fillDemo}>
          <Ionicons name="sparkles-outline" size={16} color={colors.accent} />
          <Text style={styles.demoBtnText}>{t('register.demo')}</Text>
        </TouchableOpacity>
        <Text style={styles.footNote}>{t('register.foot')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 40 },
  introBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accentLight,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg, gap: 10,
  },
  introText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 19 },
  section: {
    fontSize: 16, fontWeight: '700', color: colors.primaryDark, marginBottom: spacing.md, marginTop: spacing.sm,
  },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.sm },
  checkText: { flex: 1, marginLeft: spacing.sm, fontSize: 14, color: colors.text, lineHeight: 21 },
  footNote: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: spacing.md },
  demoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.md },
  demoBtnText: { color: colors.accent, fontWeight: '600', fontSize: 14 },
});
