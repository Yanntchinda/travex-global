import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { ScreenHeader, Button } from '../../components/common';
import PhotoPicker from '../../components/PhotoPicker';
import { createReport } from '../../services/supabase';
import { useLanguage } from '../../context/LanguageContext';

// ---------------------------------------------------------------------------
// Signaler un utilisateur : raison rédigée + preuves d'échange (photos).
// Navigation : Report { reportedName, reportedId, context }
// ---------------------------------------------------------------------------
export default function ReportScreen({ route, navigation }) {
  const { t } = useLanguage();
  const { reportedName, reportedId, context } = route.params || {};
  const [reason, setReason] = useState('');
  const [proofs, setProofs] = useState([null, null, null]); // jusqu'à 3 preuves
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const setProof = (i, uri) => setProofs((p) => p.map((x, k) => (k === i ? uri : x)));

  const submit = async () => {
    if (!reason.trim()) {
      Alert.alert(t('report.title'), t('report.required'));
      return;
    }
    setSending(true);
    try {
      await createReport({
        against: reportedName || 'Utilisateur',
        againstId: reportedId || null,
        reason: reason.trim(),
        proofs,
        context: context || null,
      });
      setDone(true);
    } finally {
      setSending(false);
    }
  };

  const back = () => navigation.goBack();

  // Confirmation d'envoi in-app (fiable sur web + mobile).
  if (done) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title={t('report.title')} onBack={back} />
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={40} color={colors.white} />
          </View>
          <Text style={styles.successTitle}>{t('report.success')}</Text>
          <Text style={styles.successText}>{t('report.successDesc')}</Text>
          <Button title={t('common.back')} icon="arrow-back" onPress={back} style={{ marginTop: spacing.xl, alignSelf: 'stretch' }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={t('report.title')} onBack={back} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Personne signalée */}
        <View style={styles.whoCard}>
          <View style={styles.whoIcon}><Ionicons name="flag" size={20} color={colors.red} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.whoLabel}>{t('report.title')}</Text>
            <Text style={styles.whoName}>{reportedName || '—'}</Text>
          </View>
        </View>

        <Text style={styles.desc}>{t('report.desc')}</Text>

        {/* Raison */}
        <Text style={styles.label}>{t('report.reason')}</Text>
        <TextInput
          style={styles.reasonInput}
          multiline
          numberOfLines={6}
          placeholder={t('report.reasonPh')}
          placeholderTextColor="#9AA3AF"
          value={reason}
          onChangeText={setReason}
          textAlignVertical="top"
        />

        {/* Preuves d'échange */}
        <Text style={styles.label}>{t('report.proofs')}</Text>
        <Text style={styles.proofsHint}>{t('report.proofsHint')}</Text>
        {proofs.map((p, i) => (
          <PhotoPicker
            key={i}
            label={`${t('report.proofs')} ${i + 1}`}
            value={p}
            onChange={(uri) => setProof(i, uri)}
            placeholder={t('report.proofs') + ' ' + (i + 1)}
          />
        ))}

        <Button
          title={t('report.submit')}
          icon="paper-plane-outline"
          onPress={submit}
          loading={sending}
          style={{ marginTop: spacing.sm }}
        />
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: '5%', paddingVertical: spacing.lg },
  whoCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: '#FDF2F2', borderWidth: 1, borderColor: '#F5D5D5',
    borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.md,
  },
  whoIcon: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#FBEAEA',
    alignItems: 'center', justifyContent: 'center',
  },
  whoLabel: { fontSize: 11, color: colors.muted, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  whoName: { fontSize: 17, fontWeight: '900', color: colors.text, marginTop: 2 },
  desc: { fontSize: 14, color: colors.muted, lineHeight: 21, marginBottom: spacing.lg },
  label: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  reasonInput: {
    backgroundColor: colors.inputBg, borderRadius: radius.sm, borderWidth: 1,
    borderColor: colors.border, padding: spacing.md, minHeight: 130,
    fontSize: 15, color: colors.text, marginBottom: spacing.lg, textAlignVertical: 'top',
  },
  proofsHint: { fontSize: 12.5, color: colors.muted, marginBottom: spacing.md, marginTop: -4 },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  successIcon: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: colors.green,
    alignItems: 'center', justifyContent: 'center',
  },
  successTitle: { fontSize: 20, fontWeight: '900', color: colors.text, marginTop: spacing.lg },
  successText: { fontSize: 14.5, color: colors.muted, textAlign: 'center', lineHeight: 21, marginTop: spacing.sm },
});
