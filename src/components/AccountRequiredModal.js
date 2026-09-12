import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../theme/theme';
import { Button } from './common';
import AppModal from './AppModal';
import { useLanguage } from '../context/LanguageContext';

// Modale « compte requis » : les visiteurs NON connectés peuvent consulter
// librement les détails des annonces, mais toute action d'ÉCRITURE
// (contacter un voyageur, réserver, proposer ses kilos, noter…) exige un
// compte. Un demandeur connecté garde accès à tout, seul un voyageur
// vérifié peut publier un départ.
export default function AccountRequiredModal({ visible, onClose, onLogin, title, message }) {
  const { t } = useLanguage();
  return (
    <AppModal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.card}>
          <View style={styles.icon}>
            <Ionicons name="person-add-outline" size={30} color={colors.white} />
          </View>
          <Text style={styles.title}>{title || t('account.requiredTitle')}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}
          <View style={styles.actions}>
            <Button title={t('common.cancel')} variant="outline" onPress={onClose} style={{ flex: 1, marginRight: spacing.sm }} />
            <Button
              title={t('account.loginSignup')}
              icon="log-in-outline"
              onPress={onLogin}
              style={{ flex: 1.4, marginLeft: spacing.sm }}
            />
          </View>
          <Text style={styles.hint}>{t('account.requiredHint')}</Text>
        </View>
      </TouchableOpacity>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: { width: '100%', maxWidth: 360, backgroundColor: colors.card, borderRadius: 24, padding: spacing.xl, alignItems: 'center', ...shadow.card },
  icon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '900', color: colors.text, marginTop: spacing.md, textAlign: 'center' },
  message: { fontSize: 13.5, color: colors.muted, textAlign: 'center', lineHeight: 20, marginTop: spacing.sm },
  actions: { flexDirection: 'row', marginTop: spacing.lg, width: '100%' },
  hint: { fontSize: 11.5, color: colors.muted, marginTop: spacing.md, textAlign: 'center' },
});
