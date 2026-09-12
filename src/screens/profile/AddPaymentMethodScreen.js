import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { ScreenHeader, EmptyState } from '../../components/common';
import { getPaymentMethods, addPaymentMethod, removePaymentMethod } from '../../services/supabase';
import { PAYMENT_MODES, maskPaymentRef } from '../../data/payments';

// « Ajouter un moyen de paiement » — l'utilisateur enregistre les références
// de ses comptes (Orange Money, MTN MoMo, PayPal, carte bancaire). Il peut
// ajouter UN ou PLUSIEURS modes : ce sont eux qui s'affichent sur ses
// annonces pour indiquer aux expéditeurs comment le payer.
// Phase 1 : comptabilité virtuelle — les références sont stockées
// localement, aucun paiement réel ne circule.
export default function AddPaymentMethodScreen({ navigation }) {
  const [methods, setMethods] = useState(null);
  const [type, setType] = useState(null); // mode en cours d'ajout
  const [values, setValues] = useState({});
  const [busy, setBusy] = useState(false);

  const load = () => { getPaymentMethods().then(setMethods).catch(() => setMethods([])); };
  useEffect(() => {
    load();
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation]);

  const mode = type ? PAYMENT_MODES[type] : null;

  const pick = (t) => {
    setType(t);
    setValues({});
  };

  const add = async () => {
    if (!mode) return;
    const ok = mode.fields.every((f) => (values[f.key] || '').trim().length > 0);
    if (!ok) return;
    setBusy(true);
    try {
      await addPaymentMethod({
        type,
        ref: values.ref,
        name: values.name,
        extra: values.extra || null,
      });
      setType(null);
      setValues({});
      load();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    const out = await removePaymentMethod(id);
    setMethods(out);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Moyens de paiement" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Note phase 1 */}
        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.noteText}>
            Enregistrez les références de vos comptes : elles s’afficheront sur vos annonces pour indiquer aux expéditeurs comment vous payer. Vous pouvez ajouter un ou plusieurs modes. Phase 1 (actuelle) : comptabilité virtuelle — aucun paiement réel ne circule ; les comptes seront vérifiés en phase 2 via un serveur sécurisé.
          </Text>
        </View>

        {/* Choix du mode */}
        <Text style={styles.sectionTitle}>Ajouter un mode de paiement</Text>
        <View style={styles.modesGrid}>
          {Object.keys(PAYMENT_MODES).map((k) => {
            const m = PAYMENT_MODES[k];
            const selected = type === k;
            return (
              <TouchableOpacity
                key={k}
                style={[styles.modeCard, selected && styles.modeCardSelected]}
                onPress={() => pick(k)}
                activeOpacity={0.85}
              >
                <View style={[styles.modeIcon, { backgroundColor: m.color }]}>
                  <Ionicons name={m.icon} size={20} color={m.text} />
                </View>
                <Text style={[styles.modeLabel, { color: selected ? colors.primary : colors.text }]}>{m.label}</Text>
                {selected && <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={styles.modeCheck} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Formulaire du mode choisi */}
        {mode && (
          <View style={styles.form}>
            {mode.fields.map((f) => (
              <View key={f.key} style={styles.fieldGroup}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  value={values[f.key] || ''}
                  onChangeText={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))}
                  placeholder={f.placeholder}
                  placeholderTextColor="#94A3B8"
                  keyboardType={f.keyboard}
                  autoCapitalize={f.key === 'name' ? 'words' : 'none'}
                  autoCorrect={false}
                />
              </View>
            ))}
            <TouchableOpacity
              style={[styles.addBtn, busy && { opacity: 0.7 }]}
              onPress={add}
              disabled={busy}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={styles.addBtnText}>Ajouter ce mode</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Modes enregistrés */}
        <Text style={styles.sectionTitle}>Vos modes enregistrés</Text>
        {methods && methods.length === 0 && (
          <EmptyState icon="wallet-outline" title="Aucun mode enregistré" subtitle="Ajoutez Orange Money, MTN MoMo, PayPal ou une carte bancaire ci-dessus." />
        )}
        {(methods || []).map((m) => {
          const meta = PAYMENT_MODES[m.type] || PAYMENT_MODES.orange;
          return (
            <View key={m.id} style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: meta.color }]}>
                <Ionicons name={meta.icon} size={18} color={meta.text} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.rowTitle}>{meta.label}</Text>
                <Text style={styles.rowRef}>{maskPaymentRef(m.type, m.ref)}{m.extra ? ' · ' + m.extra : ''}</Text>
                <Text style={styles.rowName}>{m.name}</Text>
              </View>
              <TouchableOpacity style={styles.delBtn} onPress={() => remove(m.id)} activeOpacity={0.7}>
                <Ionicons name="trash-outline" size={18} color={colors.red} />
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: '5%', paddingVertical: spacing.lg, paddingBottom: 120 },
  note: { flexDirection: 'row', backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.lg },
  noteText: { flex: 1, marginLeft: spacing.sm, fontSize: 13, color: colors.text, lineHeight: 19 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  modesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  modeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 6,
    ...shadow.card,
  },
  modeCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  modeIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modeLabel: { fontSize: 13, fontWeight: '800' },
  modeCheck: { marginLeft: 2 },
  form: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  fieldGroup: { marginBottom: spacing.md },
  label: { fontSize: 12, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: {
    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, height: 48, paddingHorizontal: 14, fontSize: 15, fontWeight: '600', color: colors.text,
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 13, marginTop: spacing.sm,
  },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, ...shadow.card,
  },
  rowIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  rowRef: { fontSize: 13, color: colors.primary, fontWeight: '700', marginTop: 2 },
  rowName: { fontSize: 12, color: colors.muted, marginTop: 2 },
  delBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.red + '14', alignItems: 'center', justifyContent: 'center' },
});
