import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { Stars } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import {updateUser, getRatings, fetchMyAnnouncements } from '../../services/supabase';
import { APP } from '../../config';
import AppModal from '../../components/AppModal';

export default function ProfileScreen({ navigation }) {
  const { user, signOut, setUser } = useAuth();
  const { t } = useLanguage();
  const { mode, setMode } = useTheme();
  const [showLogout, setShowLogout] = useState(false);
  const [liveRating, setLiveRating] = useState({ average: 0, count: 0 });
  // Compteurs réels : nombre d'annonces (départs / demandes) du compte connecté.
  const [liveCounts, setLiveCounts] = useState({ voyages: 0, demandes: 0 });
  const stats = { voyages: liveCounts.voyages, demandes: liveCounts.demandes, note: liveRating.count ? liveRating.average : (user?.stats?.note || 0) };

  // Le score affiché sur le profil réagit en temps réel aux nouveaux avis reçus.
  const loadRating = useCallback(async () => {
    if (!user) return;
    try {
      const r = await getRatings(user.id || 'me');
      setLiveRating(r);
    } catch { setLiveRating({ average: 0, count: 0 }); }
  }, [user?.id]);

  useEffect(() => {
    loadRating();
    const unsub = navigation.addListener('focus', () => loadRating());
    return unsub;
  }, [navigation, loadRating]);

  const displayNote = liveRating.count ? liveRating.average : stats.note;

  const loadCounts = useCallback(async () => {
    try {
      if (!user?.email) { setLiveCounts({ voyages: 0, demandes: 0 }); return; }
      // Annonces du compte + demandes publiées en invité depuis cet appareil.
      const list = await fetchMyAnnouncements();
      setLiveCounts({
        voyages: list.filter((a) => !a.isDemande).length,
        demandes: list.filter((a) => a.isDemande).length,
      });
    } catch (e) { /* démo : silencieux */ }
  }, [user?.email]);
  useEffect(() => { loadCounts(); }, [loadCounts]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', loadCounts);
    return unsub;
  }, [navigation, loadCounts]);

  const MENU = [
    // Changer de statut : demandeur → voyageur (références + CNI à vérifier).
    ...(user?.role !== 'admin' ? [{ icon: 'swap-horizontal-outline', label: t('profile.changeStatus'), screen: 'ChangeStatus' }] : []),
    { icon: 'person-outline', label: t('profile.personal'), screen: 'PersonalInfo' },
    { icon: 'wallet-outline', label: t('profile.payment'), screen: 'Payment' },
    { icon: 'notifications-outline', label: t('profile.notif'), screen: 'NotificationSettings' },
    { icon: 'language-outline', label: t('profile.lang'), screen: 'Language' },
    { icon: 'lock-closed-outline', label: t('profile.security'), screen: 'Security' },
    { icon: 'star-outline', label: t('profile.ratings'), screen: 'Ratings' },
    { icon: 'shield-checkmark-outline', label: t('profile.privacy'), screen: 'Privacy' },
    { icon: 'document-outline', label: t('profile.terms'), screen: 'Terms' },
    { icon: 'bulb-outline', label: t('profile.faq'), screen: 'Faq' },
    { icon: 'help-circle-outline', label: t('profile.support'), screen: 'Support' },
  ];

  const pickPhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        const updated = await updateUser({ avatar: result.assets[0].uri });
        setUser(updated);
      }
    } catch (e) {
      // Web / sandbox : la galerie peut ne pas être disponible.
      Alert.alert(t('profile.settings'), t('profile.photoPrompt'));
    }
  };

  const confirmLogout = async () => {
    setShowLogout(false);
    await signOut();
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <View style={[styles.avatar, { borderColor: colors.white }]}>
            <Ionicons name="person" size={40} color={colors.primary} />
          </View>
          <Text style={styles.name}>{t('profile.myAccount')}</Text>
          <Text style={styles.email}>{t('profile.loggedOut')}</Text>
          <Text style={styles.meta}>{t('profile.loggedOutDesc')}</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.loginBtnText}>{t('profile.loginButton')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* En-tête bleu */}
      <View style={styles.header}>
        <View style={styles.headerActions}>
          {/* Bascule Clair / Sombre — l'icône montre le mode obtenu au clic */}
          <TouchableOpacity
            style={styles.gear}
            activeOpacity={0.7}
            onPress={() => setMode(mode === 'dark' ? 'light' : 'dark')}
          >
            <Ionicons name={mode === 'dark' ? 'sunny' : 'moon'} size={22} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.gear} onPress={() => navigation.navigate('NotificationSettings')}>
            <Ionicons name="settings-outline" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.avatarTouch} activeOpacity={0.85} onPress={pickPhoto}>
          <View style={styles.avatar}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>{user?.initials || 'YT'}</Text>
            )}
            {user?.verified && <View style={styles.verifiedBadge}><Ionicons name="checkmark-circle" size={18} color={colors.green} /></View>}
            {user?.role === 'admin' && <View style={styles.adminBadge}><Ionicons name="shield-checkmark" size={16} color={colors.white} /></View>}
          </View>
          <View style={styles.cameraBadge}><Ionicons name="camera" size={14} color={colors.white} /></View>
        </TouchableOpacity>
        <Text style={styles.changePhoto}>{t('profile.photoPrompt')}</Text>
        <Text style={styles.name}>{`${user.firstName || ''} ${user.lastName || ''}`.trim() || t('profile.myAccount')}</Text>
        <Text style={styles.email}>{user?.email || t('profile.notLogged')}</Text>
        {user?.location || user?.phone ? (
          <Text style={styles.meta}>{[user?.location, user?.phone].filter(Boolean).join(' · ')}</Text>
        ) : null}

        {/* Badge du type de compte : voyageur (vérifié / en attente) ou demandeur */}
        {user?.role !== 'admin' && (
          <View style={styles.typeChip}>
            <Ionicons
              name={user?.accountType === 'voyageur' ? 'airplane' : 'cube-outline'}
              size={12}
              color={colors.white}
            />
            <Text style={styles.typeChipText}>
              {user?.accountType === 'voyageur'
                ? (user?.verified ? t('account.travelerVerified') : t('account.travelerPending'))
                : t('account.senderNoId')}
            </Text>
          </View>
        )}

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{stats.voyages}</Text>
            <Text style={styles.statLabel}>{t('profile.trips')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{stats.demandes}</Text>
            <Text style={styles.statLabel}>{t('profile.requests')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Stars value={displayNote} size={16} />
            <Text style={styles.statLabel}>{liveRating.count ? `${liveRating.count} ${t('rate.reviews')}` : t('profile.rating')}</Text>
          </View>
        </View>
      </View>

      {/* Bandeau de statut (type de compte / vérification) */}
      {user?.role === 'admin' ? (
        <View style={[styles.banner, styles.bannerGreen]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#047857" />
            <Text style={[styles.bannerText, { color: '#047857' }]}>{t('profile.adminCon')}</Text>
          </View>
        </View>
      ) : user?.accountType === 'voyageur' ? (
        user?.verified ? (
          <View style={[styles.banner, styles.bannerGreen]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name="checkmark-circle-outline" size={22} color="#047857" />
              <Text style={[styles.bannerText, { color: '#047857' }]}>{t('profile.banner.done')}</Text>
            </View>
            <TouchableOpacity style={styles.verifyBtn} onPress={() => navigation.navigate('ChangeStatus')}>
              <Text style={styles.verifyText}>{t('publish.gateButtonView')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.banner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name="hourglass-outline" size={22} color="#B7791F" />
              <Text style={styles.bannerText}>{t('profile.banner.pending')}</Text>
            </View>
            <TouchableOpacity style={styles.verifyBtn} onPress={() => navigation.navigate('ChangeStatus')}>
              <Text style={styles.verifyText}>{t('profile.banner.pendingBtn')}</Text>
            </TouchableOpacity>
          </View>
        )
      ) : (
        /* Demandeur : aucune identification requise ; passage voyageur via
           « Changer de statut » (références + CNI) pour publier des départs. */
        <View style={[styles.banner, styles.bannerBlue]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Ionicons name="cube-outline" size={22} color="#1D4ED8" />
            <Text style={[styles.bannerText, { color: '#1D4ED8' }]}>{t('profile.banner.sender')}</Text>
          </View>
          <TouchableOpacity style={styles.verifyBtn} onPress={() => navigation.navigate('ChangeStatus')}>
            <Text style={styles.verifyText}>{t('profile.banner.senderBtn')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Menu */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.menu}>
        {MENU.map((m, i) => (
          <TouchableOpacity key={i} style={styles.menuRow} onPress={() => navigation.navigate(m.screen)}>
            <Ionicons name={m.icon} size={22} color={colors.primary} />
            <Text style={styles.menuLabel}>{m.label}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={[styles.menuRow, { marginTop: spacing.sm }]} onPress={() => setShowLogout(true)}>
          <Ionicons name="log-out-outline" size={22} color={colors.red} />
          <Text style={[styles.menuLabel, { color: colors.red }]}>{t('profile.logout')}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </TouchableOpacity>

        {/* Accès espace administrateur : le propriétaire retrouve son dashboard
            depuis le profil (sans avoir à se déconnecter d'abord). */}
        <TouchableOpacity
          style={[styles.menuRow, styles.adminRow]}
          onPress={() => navigation.navigate(user?.role === 'admin' ? 'Admin' : 'AdminLogin')}
        >
          <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
          <Text style={styles.menuLabel}>{t('profile.admin')}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </TouchableOpacity>

        <Text style={styles.version}>{t('profile.version')} : {APP.version}</Text>
      </ScrollView>

      {/* Modale de déconnexion (fiable sur web + mobile) */}
      <AppModal transparent visible={showLogout} animationType="fade" onRequestClose={() => setShowLogout(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowLogout(false)}>
          <View style={styles.logoutCard}>
            <View style={styles.logoutIcon}><Ionicons name="log-out-outline" size={26} color={colors.red} /></View>
            <Text style={styles.logoutTitle}>{t('profile.logoutTitle')}</Text>
            <Text style={styles.logoutDesc}>{t('profile.logoutConfirm')}</Text>
            <View style={styles.logoutActions}>
              <TouchableOpacity style={styles.logoutCancel} onPress={() => setShowLogout(false)}>
                <Text style={styles.logoutCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutConfirm} onPress={confirmLogout}>
                <Ionicons name="log-out-outline" size={16} color={colors.white} />
                <Text style={styles.logoutConfirmText}>{t('profile.logout')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </AppModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.primary, paddingBottom: spacing.xl, paddingTop: spacing.md,
    paddingHorizontal: '5%', borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    alignItems: 'center',
  },
  gear: { padding: 8 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end' },
  avatarTouch: { marginTop: spacing.sm },
  avatar: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)',
  },
  avatarImg: { width: 78, height: 78, borderRadius: 39 },
  avatarText: { color: colors.primary, fontSize: 30, fontWeight: '800' },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.card, borderRadius: 12, padding: 2 },
  adminBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: colors.green, borderRadius: 14, padding: 3 },
  cameraBadge: {
    position: 'absolute', bottom: 0, left: 0, backgroundColor: colors.accent,
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.white,
  },
  changePhoto: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600', marginTop: 6 },
  name: { color: colors.white, fontSize: 20, fontWeight: '700', textAlign: 'center', marginTop: spacing.sm },
  email: { color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'center', marginTop: 2 },
  meta: { color: 'rgba(255,255,255,0.75)', fontSize: 13, textAlign: 'center', marginTop: 2 },
  stats: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  stat: { alignItems: 'center', width: 90 },
  statNum: { color: colors.white, fontWeight: '800', fontSize: 20 },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', alignSelf: 'stretch', marginVertical: 4 },
  loginBtn: {
    marginTop: spacing.lg, backgroundColor: colors.card,
    paddingHorizontal: spacing.xl, paddingVertical: 12, borderRadius: 24,
  },
  loginBtnText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  banner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FCF3DF',
    marginHorizontal: '5%', marginTop: -16, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: '#F0DFB2', zIndex: 2, ...shadow.card,
  },
  bannerGreen: { backgroundColor: '#ECFDF5', borderColor: '#BFE8D2' },
  bannerBlue: { backgroundColor: '#EFF4FF', borderColor: '#C7D6FE' },
  // Badge du type de compte (sous le nom, dans l'en-tête bleu)
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginTop: 8,
  },
  typeChipText: { color: colors.white, fontSize: 12, fontWeight: '800' },
  bannerText: { color: '#8A5B12', fontWeight: '600', fontSize: 14, marginLeft: 8 },
  verifyBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: 8, borderRadius: 20 },
  verifyText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  menu: { paddingHorizontal: '5%', paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    padding: spacing.lg, borderRadius: radius.md, marginBottom: spacing.sm, ...shadow.card,
  },
  // Ligne « Espace administrateur » : discrète (fond légèrement bleuté).
  adminRow: { backgroundColor: colors.primaryLight },
  menuLabel: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '600', marginLeft: spacing.lg },
  version: { textAlign: 'center', color: colors.muted, fontSize: 13, marginTop: spacing.lg },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  logoutCard: { width: '100%', maxWidth: 340, backgroundColor: colors.card, borderRadius: 24, padding: spacing.xl, alignItems: 'center', ...shadow.card },
  logoutIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FBEAEA', alignItems: 'center', justifyContent: 'center' },
  logoutTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  logoutDesc: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  logoutActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl, width: '100%' },
  logoutCancel: { flex: 1, height: 48, borderRadius: 14, backgroundColor: colors.inputBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  logoutCancelText: { color: colors.text, fontWeight: '700', fontSize: 14 },
  logoutConfirm: { flex: 1, flexDirection: 'row', gap: 6, height: 48, borderRadius: 14, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  logoutConfirmText: { color: colors.white, fontWeight: '800', fontSize: 14 },
});
