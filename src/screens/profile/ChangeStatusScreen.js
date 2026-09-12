import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { ScreenHeader, Input, Button } from '../../components/common';
import PhotoPicker from '../../components/PhotoPicker';
import Gate from '../../components/Gate';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { requestTravelerUpgrade } from '../../services/supabase';
import AppModal from '../../components/AppModal';

// Écran « Changer de statut » (espace Profil) :
//  - DEMANDEUR  : il n'a pas eu besoin de s'identifier pour publier ses
//                 demandes. S'il veut publier des DÉPARTS, il fournit ici ses
//                 références + sa CNI pour devenir voyageur.
//  - VOYAGEUR   : tant que le compte n'est pas vérifié par un administrateur,
//                 il ne peut publier AUCUN départ.
export default function ChangeStatusScreen({ navigation }) {
  const { user, setUser } = useAuth();
  const { t } = useLanguage();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState(user?.location || '');
  const [cniPhoto, setCniPhoto] = useState(null);
  const [cniSelfie, setCniSelfie] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Sans compte : impossible de changer de statut (il faut d'abord un compte).
  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title={t('status.title')} onBack={() => navigation.goBack()} />
        <Gate
          icon="swap-horizontal-outline"
          title={t('status.title')}
          subtitle={t('publish.gateNoAccountDesc')}
          buttonTitle={t('publish.gateButtonTraveler')}
          onLogin={() => navigation.navigate('SignIn', { tab: 'signup', type: 'voyageur' })}
        />
      </SafeAreaView>
    );
  }

  const isTraveler = user.accountType === 'voyageur' || user.role === 'admin';
  const isVerified = !!user.verified;

  const submit = async () => {
    setError(null);
    setSuccess(null);
    if (!firstName.trim() || !lastName.trim()) {
      setError(t('status.nameRequired'));
      return;
    }
    if (!cniPhoto || !cniSelfie) {
      setError(t('status.cniRequired'));
      return;
    }
    setSubmitting(true);
    try {
      const updated = await requestTravelerUpgrade({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        location: location.trim(),
        cniPhoto,
        cniSelfie,
      });
      setUser(updated);
      setSuccess({ title: t('status.success'), msg: t('status.successDesc') });
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Compte voyageur vérifié : tout est actif.
  const statusCard = isVerified ? (
    <View style={[styles.card, styles.cardGreen]}>
      <View style={[styles.cardIcon, { backgroundColor: '#E9F9F0' }]}>
        <Ionicons name="checkmark-circle" size={30} color={colors.green} />
      </View>
      <Text style={styles.cardTitle}>{t('status.travelerVerified')}</Text>
      <Text style={styles.cardDesc}>{t('status.travelerVerifiedDesc')}</Text>
      <View style={styles.perms}>
        <View style={styles.permRow}>
          <Ionicons name="checkmark-circle" size={16} color={colors.green} />
          <Text style={styles.permText}>{t('status.canDemand')}</Text>
        </View>
        <View style={styles.permRow}>
          <Ionicons name="checkmark-circle" size={16} color={colors.green} />
          <Text style={styles.permText}>{t('status.canDepart')}</Text>
        </View>
      </View>
    </View>
  ) : isTraveler ? (
    // Voyageur en attente de vérification : AUCUN départ publiable.
    <View style={styles.card}>
      <View style={styles.cardIcon}>
        <Ionicons name="hourglass-outline" size={30} color="#B7791F" />
      </View>
      <Text style={styles.cardTitle}>{t('status.travelerPending')}</Text>
      <Text style={styles.cardDesc}>{t('status.travelerPendingDesc')}</Text>
      <View style={styles.perms}>
        <View style={styles.permRow}>
          <Ionicons name="checkmark-circle" size={16} color={colors.green} />
          <Text style={styles.permText}>{t('status.canDemand')}</Text>
        </View>
        <View style={styles.permRow}>
          <Ionicons name="close-circle" size={16} color={colors.red} />
          <Text style={[styles.permText, { color: colors.red }]}>{t('status.canDepart')}</Text>
        </View>
      </View>
      {(user.cniPhoto || user.cniSelfie) && (
        <View style={styles.docsRow}>
          {user.cniPhoto && <Image source={{ uri: user.cniPhoto }} style={styles.docImg} resizeMode="cover" />}
          {user.cniSelfie && <Image source={{ uri: user.cniSelfie }} style={styles.docImg} resizeMode="cover" />}
        </View>
      )}
    </View>
  ) : (
    // Demandeur : aucune identification requise pour ses demandes ; formulaire
    // de passage en voyageur (références + CNI).
    <View style={styles.card}>
      <View style={[styles.cardIcon, { backgroundColor: colors.accentLight }]}>
        <Ionicons name="cube-outline" size={28} color={colors.accent} />
      </View>
      <Text style={styles.cardTitle}>{t('status.senderCard')}</Text>
      <Text style={styles.cardDesc}>{t('status.senderCardDesc')}</Text>
      <View style={styles.perms}>
        <View style={styles.permRow}>
          <Ionicons name="checkmark-circle" size={16} color={colors.green} />
          <Text style={styles.permText}>{t('status.canDemand')}</Text>
        </View>
        <View style={styles.permRow}>
          <Ionicons name="close-circle" size={16} color={colors.red} />
          <Text style={[styles.permText, { color: colors.red }]}>{t('status.canDepart')}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={t('status.title')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>{t('status.current')}</Text>
        {statusCard}

        {/* Formulaire « Devenir voyageur » : uniquement pour un demandeur
            (un voyageur déjà enregistré est déjà en cours de vérification). */}
        {!isTraveler && (
          <>
            <Text style={styles.section}>{t('status.becomeTraveler')}</Text>
            <View style={styles.formCard}>
              <View style={styles.hintBox}>
                <Ionicons name="information-circle-outline" size={18} color={colors.accent} />
                <Text style={styles.hintText}>{t('status.referencesHint')}</Text>
              </View>
              <Input label={t('register.firstName')} icon="person-outline" value={firstName} onChangeText={setFirstName} />
              <Input label={t('register.lastName')} icon="person-outline" value={lastName} onChangeText={setLastName} />
              <Input label={t('register.phone')} icon="call-outline" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <Input label={t('register.location')} icon="location-outline" value={location} onChangeText={setLocation} />
              <PhotoPicker
                label={t('register.cni')}
                value={cniPhoto}
                onChange={setCniPhoto}
                placeholder="Ajouter la photo de la CNI"
                hint="Face recto de votre carte d\u2019identité"
              />
              <PhotoPicker
                label={t('register.cniSelfie')}
                value={cniSelfie}
                onChange={setCniSelfie}
                placeholder="Ajouter la photo avec votre CNI"
                hint="Visage + CNI visibles pour la vérification"
              />
            </View>

            {error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={colors.red} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Button
              title={submitting ? t('status.sending') : t('status.submit')}
              icon="airplane-outline"
              onPress={submit}
              loading={submitting}
              style={{ marginTop: spacing.md }}
            />
          </>
        )}
      </ScrollView>

      {/* Confirmation in-app (fiable sur web ET mobile) */}
      <AppModal transparent visible={!!success} animationType="fade" onRequestClose={() => setSuccess(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIcon}><Ionicons name="checkmark" size={30} color={colors.white} /></View>
            <Text style={styles.successTitle}>{success?.title}</Text>
            <Text style={styles.successBody}>{success?.msg}</Text>
            <Button title={t('demand.close') || 'OK'} onPress={() => setSuccess(null)} style={{ marginTop: spacing.lg, width: '100%' }} />
          </View>
        </View>
      </AppModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: '5%', paddingTop: spacing.lg, paddingBottom: 40 },
  section: { fontSize: 16, fontWeight: '800', color: colors.primaryDark, marginBottom: spacing.md, marginTop: spacing.sm },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    alignItems: 'center', marginBottom: spacing.lg, ...shadow.card,
  },
  cardGreen: { borderWidth: 1.5, borderColor: '#BFE8D2' },
  cardIcon: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#FCF3DF',
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: spacing.md, textAlign: 'center' },
  cardDesc: { fontSize: 13.5, color: colors.muted, textAlign: 'center', lineHeight: 20, marginTop: spacing.sm },
  perms: { alignSelf: 'stretch', marginTop: spacing.md, gap: 8 },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.inputBg, borderRadius: radius.sm, padding: 10 },
  permText: { fontSize: 13, fontWeight: '700', color: colors.text },
  docsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, alignSelf: 'stretch' },
  docImg: { flex: 1, height: 90, borderRadius: radius.sm, backgroundColor: colors.inputBg },
  formCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, ...shadow.card },
  hintBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.accentLight,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md,
  },
  hintText: { flex: 1, fontSize: 12.5, color: colors.text, lineHeight: 18 },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FDECEC', borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: '#F5C7C7', marginTop: spacing.md,
  },
  errorText: { flex: 1, color: colors.red, fontSize: 13, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  successCard: { width: '100%', maxWidth: 360, backgroundColor: colors.card, borderRadius: 24, padding: spacing.xl, alignItems: 'center', ...shadow.card },
  successIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 18, fontWeight: '900', color: colors.text, marginTop: spacing.md, textAlign: 'center' },
  successBody: { fontSize: 14, color: colors.text, marginTop: spacing.sm, lineHeight: 20, textAlign: 'center' },
});
