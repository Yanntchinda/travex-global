import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme/theme';
import { Button } from './common';

// Écran "verrou" affiché quand un visiteur (non connecté) veut écrire,
// réserver ou publier — la CONSULTATION des annonces reste toujours libre.
export default function Gate({ onLogin, icon = 'lock-closed-outline', title, subtitle, buttonLabel, hint }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={46} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <Button title={buttonLabel || 'Créer un compte'} icon="person-add-outline" onPress={onLogin} style={{ width: '100%', marginTop: spacing.lg }} />
      <Text style={styles.hint}>{hint || 'Vous pouvez continuer à parcourir les annonces.'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: spacing.xl, backgroundColor: colors.bg,
  },
  iconWrap: {
    width: 92, height: 92, borderRadius: 46, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 19, fontWeight: '800', color: colors.text, marginTop: spacing.lg, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21, marginTop: spacing.sm },
  hint: { fontSize: 12, color: colors.muted, marginTop: spacing.md, textAlign: 'center' },
});
