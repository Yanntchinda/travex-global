import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { ScreenHeader, Button, EmptyState } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { becomeTraveler, verificationState, refreshVerification, VERIF_DELAY_MS } from '../../services/supabase';
import AppModal from '../../components/AppModal';

// « Changer de statut » : devenir voyageur pour publier des départs.
// L'expéditeur renseigne ses références (nom, téléphone, localisation) et son
// numéro de CNI — TANT QUE le compte n'est pas vérifié, il ne peut publier
// AUCUN départ (les demandes de colis restent ouvertes à tous).
// Phase 1 : vérification simulée (~20 s) ; phase 2 : vérification réelle.
export default function ChangeStatusScreen({ navigation }) {
  const { user, setUser } = useAuth();
  const { t } = useLanguage();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [cni, setCni] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [tick, setTick] = useState(0);

  // Pré-remplissage avec les références du compte.
  useEffect(() => {
    if (user) {
      setFullName(`${user.firstName || ''} ${user.lastName || ''}`.trim());
      setPhone(user.phone || '');
      setLocation(user.location || '');
    }
  }, [user?.email]);

  // Compte à rebours + bascule automatique « vérifié ».
  useEffect(() => {
    const iv = setInterval(() => {
      setTick((x) => x + 1);
      if (user) {
        refreshVerification(user)
          .then((u) => { if (u !== user) setUser(u); })
          .catch(() => {});
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [user]);

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title={t('status.title')} onBack={() => navigation.goBack()} />
        <EmptyState
          icon="person-outline"
          title={t('announce.gate')}
          subtitle={t('publish.gateTravelerDesc')}
        />
        <View style={{ paddingHorizontal: '10%' }}>
          <Button title={t('signin.signup')} icon="person-add-outline" onPress={() => navigation.navigate('SignIn')} />
        </View>
      </SafeAreaView>
    );
  }

  const st = verificationState(user);
  const secondsLeft = Math.max(0, Math.ceil(((Number(user.cniSubmittedAt) || Number(user.createdAt) || 0) + VERIF_DELAY_MS - Date.now()) / 1000));

  const submit = async () => {
    setError(null);
    if (!fullName.trim() || !cni.trim()) {
      setError(t('signin.cniRequired'));
      return;
    }
    setBusy(true);
    try {
      const u = await becomeTraveler({
        fullName: fullName.trim(),
        phone: phone.trim(),
        location: location.trim(),
        cniNumber: cni.trim(),
      });
      setUser(u);
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={t('status.title')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Déjà voyageur vérifié */}
        {st.phase === 'ok' && (
          <View style={[styles.stateCard, { backgroundColor: '#EAF7EE', borderColor: '#BFE3CC' }]}>
            <Ionicons name="shield-checkmark" size={40} color={colors.green} />
            <Text style={[styles.stateTitle, { color: '#1E7A46' }]}>{t('status.okTitle')}</Text>
            <Text style={styles.stateDesc}>{t('status.okDesc')}</Text>
            <Button title={t('status.back')} icon="arrow-back-outline" onPress={() => navigation.goBack()} style={{ marginTop: spacing.lg, width: '100%' }} />
          </View>
        )}

        {/* Vérification en cours (compte à rebours) */}
        {(st.phase === 'pending' || st.phase === 'ready') && (
          <View style={[styles.stateCard, { backgroundColor: '#FFF7E6', borderColor: '#F0DFB2' }]}>
            <Ionicons name="hourglass-outline" size={40} color="#B7791F" />
            <Text style={[styles.stateTitle, { color: '#8A5B12' }]}>{t('status.pendingTitle')}</Text>
            <Text style={styles.count}>{secondsLeft}s</Text>
            <Text style={styles.stateDesc}>{t('status.pendingDesc')}</Text>
            <Button title={t('publish.refresh')} icon="refresh-outline" onPress={() => setTick((x) => x + 1)} style={{ marginTop: spacing.lg, width: '100%' }} />
          </View>
        )}

        {/* Formulaire : expéditeur → voyageur */}
        {(st.phase === 'sender' || st.phase === 'guest') && (
          <>
            <View style={styles.intro}>
              <Ionicons name="swap-horizontal-outline" size={22} color={colors.primary} />
              <Text style={styles.introText}>{t('status.intro')}</Text>
            </View>

            <Text style={styles.label}>{t('status.fullName')}</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Ex. : Paul Mbarga" placeholderTextColor="#94A3B8" autoCapitalize="words" />

            <Text style={styles.label}>{t('status.phone')}</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+237 6XX XX XX XX" placeholderTextColor="#94A3B8" keyboardType="phone-pad" />

            <Text style={styles.label}>{t('status.location')}</Text>
            <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Ex. : Yaoundé, Cameroun" placeholderTextColor="#94A3B8" />

            <Text style={styles.label}>{t('status.cni')}</Text>
            <TextInput style={styles.input} value={cni} onChangeText={setCni} placeholder="Ex : 118745236" placeholderTextColor="#94A3B8" keyboardType="number-pad" />
            <Text style={styles.hint}>{t('signin.cniHint')}</Text>

            {error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={colors.red} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Button
              title={t('status.submit')}
              icon="shield-checkmark-outline"
              onPress={submit}
              loading={busy}
              style={{ marginTop: spacing.lg }}
            />
          </>
        )}
      </ScrollView>

      {/* Confirmation d'envoi pour vérification */}
      <AppModal transparent visible={done} animationType="fade" onRequestClose={() => setDone(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setDone(false)}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}><Ionicons name="hourglass-outline" size={28} color="#B7791F" /></View>
            <Text style={styles.modalTitle}>{t('status.pendingTitle')}</Text>
            <Text style={styles.modalDesc}>{t('status.pendingDesc')}</Text>
            <Button title="OK" onPress={() => setDone(false)} style={{ marginTop: spacing.lg, width: '100%' }} />
          </View>
        </TouchableOpacity>
      </AppModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: '5%', paddingVertical: spacing.lg, paddingBottom: 120 },
  intro: { flexDirection: 'row', backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.lg },
  introText: { flex: 1, marginLeft: spacing.sm, fontSize: 13, color: colors.text, lineHeight: 19 },
  label: { fontSize: 12, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, height: 48, paddingHorizontal: 14, fontSize: 15, fontWeight: '600', color: colors.text,
  },
  hint: { fontSize: 12, color: colors.muted, lineHeight: 17, marginTop: 6 },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FDECEC', borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: '#F5C7C7', marginTop: spacing.md,
  },
  errorText: { flex: 1, color: colors.red, fontSize: 13, fontWeight: '700' },
  stateCard: {
    alignItems: 'center', borderRadius: radius.lg, borderWidth: 1,
    padding: spacing.xl, marginTop: spacing.sm, ...shadow.card,
  },
  stateTitle: { fontSize: 18, fontWeight: '900', marginTop: spacing.md, textAlign: 'center' },
  stateDesc: { fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 19, marginTop: spacing.sm },
  count: { fontSize: 44, fontWeight: '900', color: '#B7791F', marginTop: spacing.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  modalCard: { width: '100%', maxWidth: 340, backgroundColor: colors.card, borderRadius: 24, padding: 24, alignItems: 'center', ...shadow.card },
  modalIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#FFF7E6', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 17, fontWeight: '900', color: colors.text, marginTop: 12, textAlign: 'center' },
  modalDesc: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 8, lineHeight: 19 },
});
