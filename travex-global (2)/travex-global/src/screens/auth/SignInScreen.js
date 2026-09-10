import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Modal, KeyboardAvoidingView, Platform, Pressable, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius } from '../../theme/theme';
import { signIn, signInWithGoogle, registerUser } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

// Palette "océan" de la maquette (fond sombre + accents ciel).
const OCEAN = {
  bg: '#020617',
  ocean800: '#0c4a6e',
  ocean950: '#020617',
  brand500: '#0284c7',
  brand600: '#0369a1',
  brand700: '#075985',
  sky400: '#38bdf8',
  sky200: '#bae6fd',
};

// ---------- Champ avec icône + œil ----------
function Field({ icon, value, onChangeText, secure, placeholder, keyboardType, onSubmitEditing, autoCapitalize, rightVisible, rightIcon, onRight }) {
  return (
    <View style={styles.fieldGroup}>
      <View style={styles.fieldIcon}>
        <Ionicons name={icon} size={16} color="#94A3B8" />
      </View>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        secureTextEntry={secure && !rightVisible}
        keyboardType={keyboardType}
        onSubmitEditing={onSubmitEditing}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
      {rightIcon != null && (
        <Pressable onPress={onRight} style={styles.fieldEye} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name={rightIcon} size={16} color={rightVisible ? OCEAN.brand500 : '#94A3B8'} />
        </Pressable>
      )}
    </View>
  );
}

// ---------- Case à cocher ----------
function CheckRow({ checked, label, onToggle }) {
  return (
    <TouchableOpacity style={styles.checkRow} onPress={onToggle} activeOpacity={0.8}>
      <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={20} color={checked ? OCEAN.brand500 : '#9AA3AF'} />
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

  // Google
  const [googleBusy, setGoogleBusy] = useState(false);

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

  const doGoogle = async () => {
    setGoogleBusy(true);
    try {
      const res = await signInWithGoogle();
      if (res.needsFinalize) {
        navigation.navigate('Register');
      } else {
        showToast(t('signin.toastGoogle'), false);
      }
    } finally {
      setGoogleBusy(false);
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
  const heading = isLogin ? t('signin.headingLogin') : t('signin.headingSignup');
  const subheading = isLogin ? t('signin.subheadingLogin') : t('signin.subheadingSignup');
  const toggleText = isLogin ? t('signin.noAccount') : t('signin.hasAccount');
  const toggleAction = isLogin ? t('signin.signupLink') : t('signin.loginLink');

  return (
    <SafeAreaView style={styles.safe}>
      {/* Fond dégradé océan */}
      <LinearGradient colors={[OCEAN.bg, '#061627', OCEAN.ocean800]} style={StyleSheet.absoluteFill} />

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

          {/* Carte */}
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

            <View style={styles.headingBox}>
              <Text style={styles.heading}>{heading}</Text>
              <Text style={styles.subheading}>{subheading}</Text>
            </View>

            {/* Formulaire Connexion */}
            {isLogin ? (
              <>
                <Text style={styles.label}>{t('signin.email')}</Text>
                <Field icon="mail-outline" value={loginEmail} onChangeText={setLoginEmail} placeholder={t('signin.emailPh')} keyboardType="email-address" autoCapitalize="none" onSubmitEditing={doLogin} />

                <View style={styles.pwdLabelRow}>
                  <Text style={styles.label}>{t('signin.password')}</Text>
                  <TouchableOpacity onPress={() => setForgotOpen(true)}>
                    <Text style={styles.forgot}>{t('signin.forgot')}</Text>
                  </TouchableOpacity>
                </View>
                <Field icon="lock-closed-outline" value={loginPassword} onChangeText={setLoginPassword} placeholder="••••••••" secure rightVisible={showLoginPwd} rightIcon={showLoginPwd ? 'eye-off-outline' : 'eye-outline'} onRight={() => setShowLoginPwd((v) => !v)} onSubmitEditing={doLogin} />

                <CheckRow checked={remember} label={t('signin.remember')} onToggle={() => setRemember((v) => !v)} />

                <Pressable style={[styles.cta, loginBusy && { opacity: 0.9 }]} onPress={doLogin} disabled={loginBusy}>
                  <LinearGradient colors={[OCEAN.ocean800, OCEAN.brand500, OCEAN.ocean800]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaFill}>
                    {loginBusy ? (
                      <View style={styles.ctaRow}><Ionicons name="sync" size={15} color="#fff" style={{ transform: [{ rotate: '0deg' }] }} /><Text style={styles.ctaText}>{t('signin.loginConnecting')}</Text></View>
                    ) : (
                      <View style={styles.ctaRow}><Text style={styles.ctaText}>{t('signin.login')}</Text><Ionicons name="arrow-forward" size={14} color="#fff" /></View>
                    )}
                  </LinearGradient>
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

                <CheckRow checked={acceptTerms} label={t('signin.terms')} onToggle={() => setAcceptTerms((v) => !v)} />

                <Pressable style={[styles.cta, signupBusy && { opacity: 0.9 }]} onPress={doSignup} disabled={signupBusy}>
                  <LinearGradient colors={[OCEAN.ocean800, OCEAN.brand500, OCEAN.ocean800]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaFill}>
                    {signupBusy ? (
                      <View style={styles.ctaRow}><Ionicons name="sync" size={15} color="#fff" /><Text style={styles.ctaText}>{t('signin.signupCreating')}</Text></View>
                    ) : (
                      <View style={styles.ctaRow}><Text style={styles.ctaText}>{t('signin.signup')}</Text><Ionicons name="person-add-outline" size={15} color="#fff" /></View>
                    )}
                  </LinearGradient>
                </Pressable>
              </>
            )}

            {/* Divider "Ou continuer avec" */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('signin.or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google */}
            <Pressable style={[styles.googleBtn, googleBusy && { opacity: 0.9 }]} onPress={doGoogle} disabled={googleBusy}>
              <View style={styles.googleRow}>
                <Ionicons name="logo-google" size={18} color="#4285F4" />
                <Text style={styles.googleText}>{googleBusy ? t('signin.googleConnecting') : t('signin.google')}</Text>
              </View>
            </Pressable>
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

          <Text style={styles.footer}>© 2026 TRAVEX GLOBAL. Service Sécurisé de Transit International.</Text>
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
            <Text style={styles.label}>{t('signin.email')}</Text>
            <Field icon="mail-outline" value={forgotEmail} onChangeText={setForgotEmail} placeholder={t('signin.emailPh')} keyboardType="email-address" autoCapitalize="none" />
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
  orb1: { top: 60, left: -80, width: 380, height: 380, backgroundColor: '#0284c7' },
  orb2: { bottom: 40, right: -100, width: 420, height: 420, backgroundColor: '#0c4a6e' },
  topBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingVertical: 12 },
  langPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  langFlag: { fontSize: 14 },
  langLabel: { color: '#fff', fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  brandBox: { alignItems: 'center', marginTop: 20, marginBottom: 26 },
  logo: { width: 170, height: 170, borderRadius: 34 },
  subPill: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12, backgroundColor: 'rgba(2,6,23,0.6)', borderWidth: 1, borderColor: 'rgba(56,189,248,0.25)', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 999 },
  subPillText: { color: '#bae6fd', fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },
  card: { backgroundColor: '#fff', borderRadius: 26, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 30 }, shadowOpacity: 0.5, shadowRadius: 60, elevation: 12 },
  tabs: { flexDirection: 'row', backgroundColor: '#F1F5F9', padding: 6, borderRadius: 18, marginBottom: 20 },
  tabBtn: { flex: 1, paddingVertical: 11, borderRadius: 13, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#fff', shadowColor: '#0B2545', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  tabText: { fontSize: 13, fontWeight: '800', color: '#64748B' },
  tabTextActive: { color: '#0F172A' },
  headingBox: { alignItems: 'center', marginBottom: 18 },
  heading: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  subheading: { fontSize: 12, color: '#64748B', marginTop: 4, textAlign: 'center' },
  label: { fontSize: 11, fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 8 },
  fieldGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, height: 52, overflow: 'hidden' },
  fieldIcon: { paddingLeft: 14, justifyContent: 'center' },
  fieldInput: { flex: 1, paddingHorizontal: 10, fontSize: 14, fontWeight: '600', color: '#0F172A' },
  fieldEye: { paddingRight: 14, justifyContent: 'center' },
  pwdLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  forgot: { color: OCEAN.brand600, fontWeight: '800', fontSize: 12 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, marginBottom: 6 },
  checkText: { marginLeft: 8, fontSize: 12, fontWeight: '600', color: '#475569' },
  cta: { borderRadius: 16, marginTop: 8, overflow: 'hidden', shadowColor: OCEAN.brand500, shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  ctaFill: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { marginHorizontal: 12, fontSize: 10, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6 },
  googleBtn: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  googleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  googleText: { color: '#334155', fontWeight: '700', fontSize: 14 },
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
  langOption: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 18, borderWidth: 2, borderColor: '#E2E8F0', marginBottom: 8 },
  langOptionActive: { borderColor: OCEAN.brand500, backgroundColor: '#F0F9FF' },
  langOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  langOptionFlag: { fontSize: 20 },
  langOptionName: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  toast: { position: 'absolute', bottom: 30, alignSelf: 'center', backgroundColor: 'rgba(2,6,23,0.95)', borderWidth: 1, borderColor: 'rgba(56,189,248,0.4)', borderRadius: 18, paddingHorizontal: 18, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 12 },
  toastError: { borderColor: 'rgba(251,113,133,0.5)' },
  toastText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
