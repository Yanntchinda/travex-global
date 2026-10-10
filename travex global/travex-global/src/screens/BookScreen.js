import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useLive from '../utils/useLive';
import { colors, spacing, radius, shadow, surface } from '../theme/theme';
import { ScreenHeader, Input, Button, Loading, EmptyState } from '../components/common';
import Slider from '../components/Slider';
import { getTrip, createBooking, getSessionInfo } from '../services/store';
import { isoToFr, money, kg } from '../utils/format';

const EMPTY = { firstName: '', lastName: '', phone: '', email: '', city: '', note: '' };

export default function BookScreen({ route, navigation }) {
  const { tripId, kg: initialKg } = route.params;
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [selKg, setSelKg] = useState(Number(initialKg) || 1);
  const [account, setAccount] = useState(null); // utilisateur connecté (pré-remplissage)
  const [busy, setBusy] = useState(false);

  const prefilled = useRef(false); // pré-remplissage effectué une seule fois

  // Recharge le départ et la session à chaque changement, sans écraser ce que l'utilisateur a saisi.
  const loadBook = useCallback(async () => {
    const [t, info] = await Promise.all([getTrip(tripId), getSessionInfo()]);
    setTrip(t);
    setSelKg((k) => Math.min(Math.max(1, k), Math.max(1, t ? t.remainingKg : 1)));
    if (info.role === 'user') {
      const u = info.user;
      setAccount(u);
      if (!prefilled.current) {
        prefilled.current = true;
        setForm((f) => ({
          ...f,
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          phone: u.phone || '',
          email: u.email || '',
          city: u.city || '',
        }));
      }
    } else {
      setAccount(null);
    }
    setLoading(false);
  }, [tripId]);
  useLive(loadBook);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Réserver" onBack={() => navigation.goBack()} />
        <Loading />
      </SafeAreaView>
    );
  }

  // Réserver exige un compte client : sans compte, on propose de se connecter.
  if (!account) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Réserver ce départ" onBack={() => navigation.goBack()} />
        <View style={styles.gate}>
          <Ionicons name="person-circle-outline" size={60} color={colors.primary} />
          <Text style={styles.gateTitle}>Créez un compte pour réserver</Text>
          <Text style={styles.gateText}>
            Vos réservations sont rattachées à votre compte. Vous les retrouvez dans l’onglet Réservations.
          </Text>
          <Button
            title="Se connecter ou créer un compte"
            icon="log-in-outline"
            onPress={() => navigation.navigate('Login')}
            style={{ alignSelf: 'stretch', marginTop: spacing.xl }}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!trip || trip.remainingKg <= 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Réserver" onBack={() => navigation.goBack()} />
        <EmptyState icon="alert-circle-outline" title="Plus de place disponible" subtitle="Ce départ est complet ou n’existe plus." />
      </SafeAreaView>
    );
  }

  const maxKg = Math.max(1, trip.remainingKg);
  const kgValue = Math.min(Math.max(1, selKg), maxKg);
  const total = Math.round(kgValue * trip.pricePerKg * 100) / 100;

  const fail = (msg) => {
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Vérifiez le formulaire', msg);
  };

  const submit = async () => {
    setBusy(true);
    try {
      const { booking, trip: updated } = await createBooking(trip.id, { ...form, kg: String(kgValue) });
      navigation.replace('BookingConfirmed', { booking, trip: updated });
    } catch (e) {
      fail(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Réserver ce départ" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.summary}>
          <Text style={styles.summaryRoute}>{trip.from} → {trip.to}</Text>
          <Text style={styles.summaryMeta}>
            {isoToFr(trip.date)} · {trip.transport} · {money(trip.pricePerKg)} / kg · {kg(trip.remainingKg)} kg restants
          </Text>
        </View>

        <View style={styles.accountNote}>
          <Ionicons name="checkmark-circle" size={18} color={colors.green} />
          <Text style={styles.accountNoteText}>
            Vos informations ont été pré-remplies depuis votre compte. Vous pouvez les modifier.
          </Text>
        </View>

        <Text style={styles.section}>Votre colis</Text>
        <View style={styles.weightCard}>
          <View style={styles.row}>
            <Text style={styles.label}>Poids à transporter</Text>
            <Text style={styles.kgValue}>{kg(kgValue)} kg</Text>
          </View>
          <Slider min={1} max={maxKg} value={kgValue} onChange={setSelKg} fillColor={colors.primary} thumbColor={colors.primary} />
          <View style={styles.row}>
            <Text style={styles.hint}>Minimum 1 kg</Text>
            <Text style={styles.hint}>Maximum {kg(maxKg)} kg</Text>
          </View>
        </View>

        <Text style={styles.section}>Vos références</Text>
        <Input label="Prénom *" value={form.firstName} onChangeText={set('firstName')} placeholder="Ex : Jean" />
        <Input label="Nom *" value={form.lastName} onChangeText={set('lastName')} placeholder="Ex : Dupont" />
        <Input label="Téléphone *" value={form.phone} onChangeText={set('phone')} placeholder="+237 6 00 00 00 00" keyboardType="phone-pad" />
        <Input label="E-mail" value={form.email} onChangeText={set('email')} placeholder="vous@exemple.com" keyboardType="email-address" autoCapitalize="none" />
        <Input label="Ville de résidence" value={form.city} onChangeText={set('city')} placeholder="Ex : Yaoundé" />
        <Input label="Description du colis (facultatif)" value={form.note} onChangeText={set('note')} placeholder="Contenu, dimensions…" multiline style={{ minHeight: 70 }} />

        <Text style={styles.note}>
          Votre réservation sera confirmée par TRAVEX GLOBAL. Conservez la référence qui vous sera donnée.
        </Text>
      </ScrollView>

      <View style={styles.actionBar}>
        <View>
          <Text style={styles.barLabel}>{kg(kgValue)} kg · total</Text>
          <Text style={styles.barTotal}>{money(total)}</Text>
        </View>
        <Button title="Confirmer" icon="checkmark-circle-outline" loading={busy} onPress={submit} style={{ flex: 1, marginLeft: spacing.lg }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: surface.bg },
  content: { padding: spacing.lg, paddingBottom: 130 },
  summary: { backgroundColor: surface.primaryLight, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.md },
  summaryRoute: { fontSize: 18, fontWeight: '900', color: colors.primaryDark },
  summaryMeta: { fontSize: 13, color: colors.muted, marginTop: 4, lineHeight: 19 },
  accountNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: surface.accentLight,
    borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.lg,
  },
  accountNoteText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 18 },
  gate: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  gateTitle: { fontSize: 20, fontWeight: '900', color: colors.primaryDark, marginTop: spacing.md, textAlign: 'center' },
  gateText: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20, marginTop: spacing.sm },
  section: { fontSize: 16, fontWeight: '800', color: colors.primaryDark, marginBottom: spacing.md, marginTop: spacing.sm },
  weightCard: {
    backgroundColor: surface.card, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
  label: { color: colors.muted, fontSize: 14 },
  kgValue: { fontSize: 18, fontWeight: '900', color: colors.text },
  hint: { color: colors.muted, fontSize: 12 },
  note: { color: colors.muted, fontSize: 12, marginTop: spacing.sm, lineHeight: 18 },
  actionBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center',
    backgroundColor: surface.card, borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, ...shadow.card,
  },
  barLabel: { color: colors.muted, fontSize: 12 },
  barTotal: { color: colors.accent, fontSize: 20, fontWeight: '900' },
});
