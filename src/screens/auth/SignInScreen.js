import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Modal, KeyboardAvoidingView, Platform, Pressable, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius } from '../../theme/theme';
import { signIn, registerUser } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

// Palette "océan" de la maquette (fond sombre + accents ciel).
const OCEAN = {
  bg: '#020617',
  ocean800: '#0c4a6e',
  ocean950: '#020617',
  brand500: '#0043E0',
  brand600: '#0038BE',
  brand700: '#002B95',
  sky400: '#5C86FF',
  sky200: '#C7D6FE',
};

// ---------- Champ avec icône + œil ----------
// Variante « verre » (fond sombre translucide, maquette glassmorphism) par
// défaut ; `light` = variante claire pour les champs des modales blanches.
function Field({ icon, value, onChangeText, secure, placeholder, keyboardType, onSubmitEditing, autoCapitalize, rightVisible, rightIcon, onRight, light }) {
  const [focused, setFocused] = useState(false);
  const iconColor = light ? '#94A3B8' : 'rgba(255,255,255,0.55)';
  return (
    <View
      style={[
        light ? styles.fieldGroupLight : styles.fieldGroup,
        focused && (light ? styles.fieldGroupLightFocus : styles.fieldGroupFocus),
      ]}
    >
      <View style={styles.fieldIcon}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <TextInput
        style={light ? styles.fieldInputLight : styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={light ? '#94A3B8' : '#A0A0A0'}
        secureTextEntry={secure && !rightVisible}
        keyboardType={keyboardType}
        onSubmitEditing={onSubmitEditing}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {rightIcon != null && (
        <Pressable onPress={onRight} style={styles.fieldEye} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name={rightIcon} size={16} color={rightVisible ? '#8FA8FF' : iconColor} />
        </Pressable>
      )}
    </View>
  );
}

// ---------- Case à cocher ----------
function CheckRow({ checked, label, onToggle }) {
  return (
    <TouchableOpacity style={styles.checkRow} onPress={onToggle} activeOpacity={0.8}>
      <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={20} color={checked ? '#5C86FF' : 'rgba(255,255,255,0.55)'} />
      <Text style={styles.checkText}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function SignInScreen({ navigation }) {
  const { setUser } = useAuth();
  const { t, lang, chooseLang, setLang } = useLanguage();

  // Onglet actif : 'login' | 'signup'
  const [tab, setTab] = useState('login');

  // Connexion
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);

  // Inscription
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [showSignupPwd, setShowSignupPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [signupBusy, setSignupBusy] = useState(false);

  // Contact (visible ensuite dans le profil de l'utilisateur)
  const [signupPhone, setSignupPhone] = useState('');
  const [signupLocation, setSignupLocation] = useState('');

  // Modales
  const [langOpen, setLangOpen] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotBusy, setForgotBusy] = useState(false);

  // Toast
  const [toast, setToast] = useState(null); // { msg, error }
  const toastTimer = useRef(null);

  const showToast = (msg, error = false) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, error });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const switchTab = (t) => setTab(t);

  const doLogin = async () => {
    if (!loginEmail.trim() || !loginPassword) {
      showToast(t('signin.fillRequired'), true);
      return;
    }
    setLoginBusy(true);
    try {
      const { user } = await signIn({ email: loginEmail.trim(), password: loginPassword });
      if (!user) throw new Error(t('signin.toastLogin'));
      setUser(user);
      showToast(t('signin.loginSuccess'), false);
      setTimeout(() => {
        if (user.role === 'admin') {
          setLang('en');
          navigation.reset({ index: 0, routes: [{ name: 'Admin' }] });
        } else {
          navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        }
      }, 700);
    } catch (e) {
      showToast(e.message || t('signin.toastLogin') + ' : ' + t('auth.fail'), true);
    } finally {
      setLoginBusy(false);
    }
  };

  const doSignup = async () => {
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword) {
      showToast(t('signin.fillRequired'), true);
      return;
    }
    if (signupPassword !== signupConfirm) {
      showToast(t('signin.toastPwdMismatch'), true);
      return;
    }
    if (!acceptTerms) {
      showToast(t('signin.termsRequired'), true);
      return;
    }
    setSignupBusy(true);
    try {
      const parts = signupName.trim().split(/\s+/);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ');
      const user = await registerUser({
        firstName,
        lastName,
        email: signupEmail.trim(),
        password: signupPassword,
        location: '',
        phone: '',
        // CNI simulées pour que le profil passe en "en attente de vérification" (visible côté admin).
        cniPhoto: 'https://via.placeholder.com/300x180?text=CNI',
        cniSelfie: 'https://via.placeholder.com/300x180?text=Selfie',
      });
      setUser(user);
      showToast(t('signin.signupSuccess'), false);
      setTimeout(() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] }), 700);
    } catch (e) {
      showToast(e.message, true);
    } finally {
      setSignupBusy(false);
    }
  };

  const doForgot = () => {
    if (!forgotEmail.trim()) {
      showToast(t('signin.fillRequired'), true);
      return;
    }
    setForgotBusy(true);
    setTimeout(() => {
      setForgotBusy(false);
      setForgotOpen(false);
      showToast(t('signin.toastForgot'), false);
    }, 1200);
  };

  const pickLang = (l) => {
    setLang(l);
    setLangOpen(false);
    showToast(l === 'fr' ? 'Français' : 'English', false);
  };

  const langFlag = lang === 'fr' ? '🇫🇷' : '🇬🇧';
  const isLogin = tab === 'login';
  const toggleText = isLogin ? t('signin.noAccount') : t('signin.hasAccount');
  const toggleAction = isLogin ? t('signin.signupLink') : t('signin.loginLink');

  return (
    <SafeAreaView style={styles.safe}>
      {/* Photo de fond : voyageur face à un avion (nuit) — cf. dossier assets/hero */}
      <Image source={require('../../../assets/hero/login-bg.jpg')} style={StyleSheet.absoluteFill} resizeMode="cover" />
      {/* Voile sombre uniforme (~50 %) comme la maquette : la photo reste
          visible derrière la carte de verre dépoli, textes blancs garantis. */}
      <LinearGradient
        colors={['rgba(0,0,0,0.42)', 'rgba(0,0,0,0.52)']}
        style={StyleSheet.absoluteFill}
      />

      {/* Orbes lumineux */}
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Barre du haut : sélecteur de langue */}
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.langPill} onPress={() => setLangOpen(true)}>
              <Text style={styles.langFlag}>{langFlag}</Text>
              <Text style={styles.langLabel}>{lang.toUpperCase()}</Text>
              <Ionicons name="chevron-down" size={13} color={OCEAN.sky400} />
            </TouchableOpacity>
          </View>

          {/* Logo officiel TRAVEX GLOBAL */}
          <View style={styles.brandBox}>
            <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            <View style={styles.subPill}>
              <Ionicons name="airplane" size={11} color={OCEAN.sky400} />
              <Text style={styles.subPillText}>{t('signin.brandSubtitle')}</Text>
            </View>
          </View>

          {/* Carte « verre dépoli sombre » (glassmorphism, maquette) :
              blanc translucide 12 %, flou d'arrière-plan 16 px, fine bordure
              blanche — la photo (voyageur + avion) reste visible derrière.
              Les onglets tiennent lieu de titre (maquette épurée) pour que le
              bouton reste visible sans défiler. */}
          <View style={styles.card}>
            {/* Onglets Connexion / Inscription */}
            <View style={styles.tabs}>
              <TouchableOpacity style={[styles.tabBtn, isLogin && styles.tabBtnActive]} onPress={() => switchTab('login')} activeOpacity={0.85}>
                <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>{t('signin.tabLogin')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabBtn, !isLogin && styles.tabBtnActive]} onPress={() => switchTab('signup')} activeOpacity={0.85}>
                <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>{t('signin.tabSignup')}</Text>
              </TouchableOpacity>
            </View>

            {/* Formulaire Connexion */}
            {isLogin ? (
              <>
                <Text style={styles.label}>{t('signin.email')}</Text>
                <Field icon="mail-outline" value={loginEmail} onChangeText={setLoginEmail} placeholder={t('signin.emailPh')} keyboardType="email-address" autoCapitalize="none" onSubmitEditing={doLogin} />

                <Text style={styles.label}>{t('signin.password')}</Text>
                <Field icon="lock-closed-outline" value={loginPassword} onChangeText={setLoginPassword} placeholder="••••••••" secure rightVisible={showLoginPwd} rightIcon={showLoginPwd ? 'eye-off-outline' : 'eye-outline'} onRight={() => setShowLoginPwd((v) => !v)} onSubmitEditing={doLogin} />

                {/* Rangée options (maquette) : se souvenir de moi + mot de passe oublié */}
                <View style={styles.optionsRow}>
                  <CheckRow checked={remember} label={t('signin.remember')} onToggle={() => setRemember((v) => !v)} />
                  <TouchableOpacity onPress={() => setForgotOpen(true)}>
                    <Text style={styles.forgot}>{t('signin.forgot')}</Text>
                  </TouchableOpacity>
                </View>

                <Pressable style={[styles.cta, loginBusy && { opacity: 0.9 }]} onPress={doLogin} disabled={loginBusy}>
                  <View style={styles.ctaFill}>
                    {loginBusy ? (
                      <View style={styles.ctaRow}><Ionicons name="sync" size={15} color="#fff" /><Text style={styles.ctaText}>{t('signin.loginConnecting')}</Text></View>
                    ) : (
                      <View style={styles.ctaRow}><Text style={styles.ctaText}>{t('signin.login')}</Text><Ionicons name="arrow-forward" size={14} color="#fff" /></View>
                    )}
                  </View>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.label}>{t('signin.fullName')}</Text>
                <Field icon="person-outline" value={signupName} onChangeText={setSignupName} placeholder={t('signin.fullNamePh')} />

                <Text style={styles.label}>{t('signin.email')}</Text>
                <Field icon="mail-outline" value={signupEmail} onChangeText={setSignupEmail} placeholder={t('signin.emailPh')} keyboardType="email-address" autoCapitalize="none" />

                <Text style={styles.label}>{t('signin.password')}</Text>
                <Field icon="lock-closed-outline" value={signupPassword} onChangeText={setSignupPassword} placeholder="••••••••" secure rightVisible={showSignupPwd} rightIcon={showSignupPwd ? 'eye-off-outline' : 'eye-outline'} onRight={() => setShowSignupPwd((v) => !v)} />

                <Text style={styles.label}>{t('signin.confirmPassword')}</Text>
                <Field icon="shield-checkmark-outline" value={signupConfirm} onChangeText={setSignupConfirm} placeholder="••••••••" secure rightVisible={showConfirmPwd} rightIcon={showConfirmPwd ? 'eye-off-outline' : 'eye-outline'} onRight={() => setShowConfirmPwd((v) => !v)} />

                {/* Contact — ces informations apparaîtront dans votre profil */}
                <View style={styles.contactSection}>
                  <View style={styles.contactTitleRow}>
                    <Ionicons name="id-card-outline" size={15} color="rgba(255,255,255,0.75)" />
                    <Text style={styles.contactTitle}>{t('signin.contactSection')}</Text>
                  </View>
                  <Text style={styles.label}>{t('signin.phone')}</Text>
                  <Field icon="call-outline" value={signupPhone} onChangeText={setSignupPhone} placeholder={t('signin.phonePh')} keyboardType="phone-pad" />
                  <Text style={styles.label}>{t('signin.location')}</Text>
                  <Field icon="location-outline" value={signupLocation} onChangeText={setSignupLocation} placeholder={t('signin.locationPh')} />
                </View>

                <View style={styles.termsRow}>
                  <CheckRow checked={acceptTerms} label={t('signin.terms')} onToggle={() => setAcceptTerms((v) => !v)} />
                </View>

                <Pressable style={[styles.cta, signupBusy && { opacity: 0.9 }]} onPress={doSignup} disabled={signupBusy}>
                  <View style={styles.ctaFill}>
                    {signupBusy ? (
                      <View style={styles.ctaRow}><Ionicons name="sync" size={15} color="#fff" /><Text style={styles.ctaText}>{t('signin.signupCreating')}</Text></View>
                    ) : (
                      <View style={styles.ctaRow}><Text style={styles.ctaText}>{t('signin.signup')}</Text><Ionicons name="person-add-outline" size={15} color="#fff" /></View>
                    )}
                  </View>
                </Pressable>
              </>
            )}

          </View>

          {/* Lien basculant */}
          <View style={styles.footerToggle}>
            <Text style={styles.footerToggleText}>{toggleText}</Text>
            <TouchableOpacity onPress={() => switchTab(isLogin ? 'signup' : 'login')}>
              <View style={styles.footerLinkRow}>
                <Text style={styles.footerLink}>{toggleAction}</Text>
                <Ionicons name="arrow-forward" size={12} color={OCEAN.sky400} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Accès invité (consultation des annonces) */}
          <TouchableOpacity style={styles.guestBtn} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}>
            <Ionicons name="compass-outline" size={14} color="#94A3B8" />
            <Text style={styles.guestText}>{t('home.guestExplore')}</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>© 2026 TRAVEX GLOBAL. Service sécurisé de transit international.</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modale : langue */}
      <Modal transparent visible={langOpen} animationType="fade" onRequestClose={() => setLangOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity onPress={() => setLangOpen(false)} style={styles.modalClose}><Ionicons name="close" size={18} color="#94A3B8" /></TouchableOpacity>
            <View style={styles.modalIcon}><Ionicons name="globe-outline" size={22} color={OCEAN.brand500} /></View>
            <Text style={styles.modalTitle}>{t('signin.langTitle')}</Text>
            <Text style={styles.modalDesc}>{t('signin.langDesc')}</Text>
            <TouchableOpacity style={[styles.langOption, lang === 'fr' && styles.langOptionActive]} onPress={() => pickLang('fr')}>
              <View style={styles.langOptionLeft}><Text style={styles.langOptionFlag}>🇫🇷</Text><Text style={styles.langOptionName}>Français</Text></View>
              <Ionicons name={lang === 'fr' ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={lang === 'fr' ? OCEAN.brand500 : '#CBD5E1'} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.langOption, lang === 'en' && styles.langOptionActive]} onPress={() => pickLang('en')}>
              <View style={styles.langOptionLeft}><Text style={styles.langOptionFlag}>🇬🇧</Text><Text style={styles.langOptionName}>English</Text></View>
              <Ionicons name={lang === 'en' ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={lang === 'en' ? OCEAN.brand500 : '#CBD5E1'} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modale : mot de passe oublié */}
      <Modal transparent visible={forgotOpen} animationType="fade" onRequestClose={() => setForgotOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity onPress={() => setForgotOpen(false)} style={styles.modalClose}><Ionicons name="close" size={18} color="#94A3B8" /></TouchableOpacity>
            <View style={styles.modalIcon}><Ionicons name="key-outline" size={22} color={OCEAN.brand500} /></View>
            <Text style={styles.modalTitle}>{t('signin.forgotTitle')}</Text>
            <Text style={styles.modalDesc}>{t('signin.forgotDesc')}</Text>
            <Text style={styles.modalLabel}>{t('signin.email')}</Text>
            <Field light icon="mail-outline" value={forgotEmail} onChangeText={setForgotEmail} placeholder={t('signin.emailPh')} keyboardType="email-address" autoCapitalize="none" />
            <Pressable style={[styles.cta, forgotBusy && { opacity: 0.9 }]} onPress={doForgot} disabled={forgotBusy}>
              <View style={[styles.ctaFill, { backgroundColor: OCEAN.brand500 }]}>
                <View style={styles.ctaRow}>
                  <Text style={styles.ctaText}>{forgotBusy ? t('signin.forgotSending') : t('signin.forgotBtn')}</Text>
                  <Ionicons name="paper-plane-outline" size={14} color="#fff" />
                </View>
              </View>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Toast */}
      {toast && (
        <View style={[styles.toast, toast.error && styles.toastError]}>
          <Ionicons name={toast.error ? 'alert-circle' : 'checkmark-circle'} size={18} color={toast.error ? '#FB7185' : OCEAN.sky400} />
          <Text style={styles.toastText}>{toast.msg}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: OCEAN.bg },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 24 },
  orb: { position: 'absolute', borderRadius: 200, opacity: 0.35 },
  orb1: { top: 60, left: -80, width: 380, height: 380, backgroundColor: '#0043E0' },
  orb2: { bottom: 40, right: -100, width: 420, height: 420, backgroundColor: '#0c4a6e' },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingVertical: 8 },
  langPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  langFlag: { fontSize: 14 },
  langLabel: { color: '#fff', fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  brandBox: { alignItems: 'center', marginTop: 10, marginBottom: 14 },
  logo: { width: 170, height: 170, borderRadius: 34 },
  subPill: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12, backgroundColor: 'rgba(2,6,23,0.6)', borderWidth: 1, borderColor: 'rgba(56,189,248,0.25)', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 999 },
  subPillText: { color: '#bae6fd', fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },
  // Carte « verre dépoli » de la maquette : blanc 12 % + flou 16 px +
  // bordure blanche fine + ombre douce, largeur max 400 centrée.
  card: {
    width: '100%', maxWidth: 400, alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16, paddingVertical: 26, paddingHorizontal: 28,
    boxShadow: '0 8px 32px rgba(0,0,0,0.37)',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(16px)' } : {}),
  },
  tabs: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', padding: 6, borderRadius: 12, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 11, borderRadius: 8, alignItems: 'center' },
  tabBtnActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  tabText: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.65)' },
  tabTextActive: { color: '#FFFFFF' },
  label: { fontSize: 13, fontWeight: '600', color: '#E0E0E0', marginBottom: 7, marginTop: 10 },
  // Champ « verre » (maquette) : fond blanc 8 %, bordure blanche 30 %,
  // radius 8 ; focus = bordure bleue + halo lumineux.
  fieldGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 8, height: 50 },
  fieldGroupFocus: { borderColor: '#0043E0', backgroundColor: 'rgba(255,255,255,0.15)', boxShadow: '0 0 8px rgba(0,67,224,0.4)' },
  fieldInput: { flex: 1, paddingHorizontal: 10, fontSize: 15, fontWeight: '500', color: '#FFFFFF' },
  // Variante claire (champs dans les modales blanches).
  fieldGroupLight: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, height: 50 },
  fieldGroupLightFocus: { borderColor: OCEAN.brand500, backgroundColor: '#FFFFFF', boxShadow: '0 0 8px rgba(0,67,224,0.25)' },
  fieldInputLight: { flex: 1, paddingHorizontal: 10, fontSize: 14, fontWeight: '600', color: '#0F172A' },
  fieldIcon: { paddingLeft: 14, justifyContent: 'center' },
  fieldEye: { paddingRight: 14, justifyContent: 'center' },
  optionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 8 },
  termsRow: { marginTop: 12, marginBottom: 8 },
  forgot: { color: '#A5B4FC', fontWeight: '600', fontSize: 13 },
  checkRow: { flexDirection: 'row', alignItems: 'center' },
  checkText: { marginLeft: 8, fontSize: 13, fontWeight: '500', color: '#E0E0E0' },
  cta: { borderRadius: 8, marginTop: 6, overflow: 'hidden', boxShadow: '0 6px 18px rgba(0,67,224,0.35)' },
  ctaFill: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: OCEAN.brand500 },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  // Section « Contact » du formulaire d'inscription (visible dans le profil).
  contactSection: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.18)' },
  contactTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  contactTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },
  footerToggle: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 22, gap: 6 },
  footerToggleText: { color: '#CBD5E1', fontSize: 13, fontWeight: '600' },
  footerLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerLink: { color: OCEAN.sky400, fontWeight: '800', fontSize: 13 },
  guestBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 14, paddingVertical: 10,
  },
  guestText: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
  footer: { color: 'rgba(186,230,253,0.5)', fontSize: 11, textAlign: 'center', marginTop: 18, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.85)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 320, backgroundColor: '#fff', borderRadius: 26, padding: 24, alignItems: 'center' },
  modalClose: { position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modalIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  modalDesc: { fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4, marginBottom: 16 },
  modalLabel: { fontSize: 11, fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, alignSelf: 'flex-start' },
  langOption: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 18, borderWidth: 2, borderColor: '#E2E8F0', marginBottom: 8 },
  langOptionActive: { borderColor: OCEAN.brand500, backgroundColor: '#F0F9FF' },
  langOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  langOptionFlag: { fontSize: 20 },
  langOptionName: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  toast: { position: 'absolute', bottom: 30, alignSelf: 'center', backgroundColor: 'rgba(2,6,23,0.95)', borderWidth: 1, borderColor: 'rgba(56,189,248,0.4)', borderRadius: 18, paddingHorizontal: 18, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 12 },
  toastError: { borderColor: 'rgba(251,113,133,0.5)' },
  toastText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
