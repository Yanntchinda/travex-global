import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, shadow } from '../theme/theme';
import { useLanguage } from '../context/LanguageContext';
import Logo from '../components/Logo';

// Choix de langue de démarrage FR / EN — s'affiche au tout premier lancement.
export default function LanguageGate() {
  const { chooseLang } = useLanguage();

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={[colors.primary, '#0E6B73']}
        style={styles.bg}
      >
        <View style={styles.top}>
          <Logo width={300} height={130} showText={false} />
          <Text style={styles.title}>TRAVEX GLOBAL</Text>
          <Text style={styles.subtitle}>Transit de colis & documents</Text>
        </View>

        <View style={styles.bottom}>
          <Text style={styles.chooseTitle}>Choisissez votre langue</Text>
          <Text style={styles.chooseSub}>Choose your language</Text>

          <TouchableOpacity style={styles.btn} activeOpacity={0.9} onPress={() => chooseLang('fr')}>
            <View style={styles.btnIcon}><Ionicons name="language" size={20} color={colors.primary} /></View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.btnTitle}>Français</Text>
              <Text style={styles.btnSub}>Continuer en français</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.btn} activeOpacity={0.9} onPress={() => chooseLang('en')}>
            <View style={styles.btnIcon}><Ionicons name="globe-outline" size={20} color={colors.accent} /></View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.btnTitle}>English</Text>
              <Text style={styles.btnSub}>Continue in English</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  bg: { flex: 1, justifyContent: 'space-between', padding: spacing.lg },
  top: { alignItems: 'center', marginTop: spacing.xxl * 2 },
  title: { color: colors.white, fontSize: 24, fontWeight: '800', letterSpacing: 1, marginTop: spacing.sm },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
  bottom: {
    backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.xl,
    ...shadow.card, marginBottom: spacing.lg,
  },
  chooseTitle: { fontSize: 19, fontWeight: '800', color: colors.text },
  chooseSub: { fontSize: 13, color: colors.muted, marginTop: 2, marginBottom: spacing.lg },
  btn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg,
    borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  btnIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  btnTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  btnSub: { fontSize: 13, color: colors.muted, marginTop: 2 },
});
