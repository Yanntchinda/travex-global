import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow, surface } from '../theme/theme';
import { ScreenHeader, Input, Button, EmptyState } from '../components/common';
import {
  isAdmin, logout, publishTrip, listAllTrips, setTripStatus, deleteTrip,
  listBookings, setBookingStatus, BOOKING_STATUS,
} from '../services/store';
import { TRANSPORTS, CURRENCY } from '../config';
import { frToIso, isoToFr, money, kg } from '../utils/format';
import { MODE_META } from '../utils/modes';
import useLive from '../utils/useLive';

const TABS = [
  { key: 'publish', label: 'Publier', icon: 'add-circle-outline' },
  { key: 'trips', label: 'Départs', icon: 'airplane-outline' },
  { key: 'bookings', label: 'Réservations', icon: 'receipt-outline' },
];

function notify(title, msg) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}
function confirmAction(msg, onOk) {
  if (Platform.OS === 'web') {
    if (window.confirm(msg)) onOk();
  } else {
    Alert.alert('Confirmation', msg, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Oui', style: 'destructive', onPress: onOk },
    ]);
  }
}

const STATUS_LABEL = {
  [BOOKING_STATUS.pending]: { label: 'En attente', color: colors.orange },
  [BOOKING_STATUS.confirmed]: { label: 'Confirmée', color: colors.green },
  [BOOKING_STATUS.cancelled]: { label: 'Annulée', color: colors.red },
};

export default function AdminScreen({ navigation }) {
  const [tab, setTab] = useState('publish');
  const [checked, setChecked] = useState(false);
  const [tripFilter, setTripFilter] = useState('');        // '' = tous les modes
  const [bookingFilter, setBookingFilter] = useState({ transport: '', tripId: '' });

  useEffect(() => {
    isAdmin().then((ok) => {
      if (!ok) navigation.replace('AdminLogin');
      else setChecked(true);
    });
  }, [navigation]);

  const doLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  // Depuis un départ : ouvrir directement ses réservations
  const openBookingsOf = (trip) => {
    setBookingFilter({ transport: trip.transport, tripId: trip.id });
    setTab('bookings');
  };

  if (!checked) return <SafeAreaView style={styles.safe} edges={['top']} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Espace admin" onBack={() => navigation.navigate('Main')} rightIcon="log-out-outline" onRight={doLogout} />
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} style={[styles.tab, tab === t.key && styles.tabActive]}>
            <Ionicons name={t.icon} size={16} color={tab === t.key ? colors.white : colors.primary} />
            <Text style={[styles.tabText, tab === t.key && { color: colors.white }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'publish' && (
        <PublishForm onPublished={(mode) => { setTripFilter(mode); setTab('trips'); }} />
      )}
      {tab === 'trips' && (
        <TripsList filter={tripFilter} setFilter={setTripFilter} onOpenBookings={openBookingsOf} />
      )}
      {tab === 'bookings' && (
        <BookingsList filter={bookingFilter} setFilter={setBookingFilter} />
      )}
    </SafeAreaView>
  );
}

// Filtre par mode de transport (Avion / Cargo / RO-RO)
function ModeChips({ value, onChange, allLabel = 'Tous' }) {
  const items = [{ key: '', label: allLabel }, ...TRANSPORTS.map((t) => ({ key: t, label: MODE_META[t].label, color: MODE_META[t].color }))];
  return (
    <View style={styles.chips}>
      {items.map((it) => {
        const active = value === it.key;
        const color = it.color || colors.primary;
        return (
          <TouchableOpacity
            key={it.key || 'all'}
            onPress={() => onChange(it.key)}
            style={[styles.chip, { borderColor: color }, active && { backgroundColor: color }]}
          >
            <Text style={[styles.chipText, { color: active ? colors.white : color }]}>{it.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ---------- Publier un départ (par mode) ----------
function PublishForm({ onPublished }) {
  const EMPTY = { from: '', to: '', date: '', arrival: '', pricePerKg: '', capacityKg: '', description: '' };
  const [mode, setMode] = useState('Avion');
  const [f, setF] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));

  const submit = async () => {
    const date = frToIso(f.date);
    if (!date) return notify('Date invalide', 'Indiquez la date de départ au format JJ.MM.AAAA.');
    let arrivalDate = '';
    if (f.arrival.trim()) {
      arrivalDate = frToIso(f.arrival);
      if (!arrivalDate) return notify('Date invalide', 'La date d’arrivée doit être au format JJ.MM.AAAA.');
    }
    setBusy(true);
    try {
      await publishTrip({ ...f, date, arrivalDate, transport: mode });
      setF(EMPTY);
      notify('Départ publié', `${MODE_META[mode].title} : ${f.from} → ${f.to}. Il est visible côté client.`);
      onPublished(mode);
    } catch (e) {
      notify('Publication impossible', e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={styles.label}>Onglet où publier</Text>
      <View style={styles.modeRow}>
        {TRANSPORTS.map((t) => {
          const m = MODE_META[t];
          const active = mode === t;
          return (
            <TouchableOpacity key={t} onPress={() => setMode(t)} style={[styles.modeBtn, { borderColor: m.color }, active && { backgroundColor: m.color }]}>
              <Ionicons name={m.icon} size={18} color={active ? colors.white : m.color} />
              <Text style={[styles.modeBtnText, { color: active ? colors.white : m.color }]}>{m.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Input label="Ville de départ *" value={f.from} onChangeText={set('from')} placeholder="Ex : Douala" />
      <Input label="Ville d’arrivée *" value={f.to} onChangeText={set('to')} placeholder="Ex : Genève" />
      <Input label="Date de départ *" value={f.date} onChangeText={set('date')} placeholder="JJ.MM.AAAA (ex : 06.11.2026)" keyboardType="numbers-and-punctuation" />
      <Input label="Date d’arrivée (facultatif)" value={f.arrival} onChangeText={set('arrival')} placeholder="JJ.MM.AAAA" keyboardType="numbers-and-punctuation" />
      <Input label={`Tarif par kg (${CURRENCY}) *`} value={f.pricePerKg} onChangeText={set('pricePerKg')} placeholder="Ex : 10" keyboardType="decimal-pad" />
      <Input label="Capacité disponible (kg) *" value={f.capacityKg} onChangeText={set('capacityKg')} placeholder="Ex : 23" keyboardType="decimal-pad" />
      <Input label="Informations (facultatif)" value={f.description} onChangeText={set('description')} placeholder="Bagage, conditions de remise…" multiline style={{ minHeight: 80 }} />

      <Button title={`Publier en ${MODE_META[mode].label}`} icon="checkmark-circle-outline" loading={busy} onPress={submit} style={{ marginTop: spacing.sm }} />
    </ScrollView>
  );
}

// ---------- Liste des départs ----------
function TripsList({ filter, setFilter, onOpenBookings }) {
  const [trips, setTrips] = useState([]);
  const load = useCallback(async () => setTrips(await listAllTrips({ transport: filter })), [filter]);
  useLive(load);

  const toggle = async (tr) => {
    await setTripStatus(tr.id, tr.status === 'open' ? 'closed' : 'open');
    load();
  };
  const remove = (tr) => confirmAction(
    `Supprimer le départ ${tr.from} → ${tr.to} ainsi que ses réservations ?`,
    async () => { await deleteTrip(tr.id); load(); }
  );

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ModeChips value={filter} onChange={setFilter} allLabel="Tous" />
      {trips.length === 0 ? (
        <EmptyState icon="airplane-outline" title="Aucun départ" subtitle="Publiez un départ dans l’onglet Publier." />
      ) : trips.map((tr) => (
        <View key={tr.id} style={styles.card}>
          <View style={styles.cardHead}>
            <ModeTag transport={tr.transport} />
            <Badge label={tr.status === 'open' ? 'Ouvert' : 'Fermé'} color={tr.status === 'open' ? colors.green : colors.muted} />
          </View>
          <Text style={styles.cardTitle}>{tr.from} → {tr.to}</Text>
          <Text style={styles.cardMeta}>{isoToFr(tr.date)} · {money(tr.pricePerKg)} / kg</Text>
          <Text style={styles.cardMeta}>
            {kg(tr.bookedKg)} kg réservés sur {kg(tr.capacityKg)} kg · {kg(tr.remainingKg)} kg restants · {tr.bookingCount} réservation{tr.bookingCount > 1 ? 's' : ''}
          </Text>
          <View style={styles.actions}>
            <SmallBtn label={`Réservations (${tr.bookingCount})`} icon="receipt-outline" onPress={() => onOpenBookings(tr)} />
            <SmallBtn label={tr.status === 'open' ? 'Fermer' : 'Rouvrir'} icon={tr.status === 'open' ? 'pause-circle-outline' : 'play-circle-outline'} onPress={() => toggle(tr)} />
            <SmallBtn label="Supprimer" icon="trash-outline" danger onPress={() => remove(tr)} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// ---------- Réservations : par mode, puis par départ ----------
function BookingsList({ filter, setFilter }) {
  const [trips, setTrips] = useState([]);
  const [items, setItems] = useState([]);

  const load = useCallback(async () => {
    const [t, b] = await Promise.all([
      listAllTrips({ transport: filter.transport }),
      listBookings({ transport: filter.transport, tripId: filter.tripId }),
    ]);
    setTrips(t);
    setItems(b);
  }, [filter.transport, filter.tripId]);

  useLive(load);

  const setStatus = async (b, status) => {
    try {
      await setBookingStatus(b.id, status);
      load();
    } catch (e) {
      notify('Action impossible', e.message);
    }
  };

  const activeTrip = filter.tripId ? trips.find((t) => t.id === filter.tripId) : null;
  const totalKg = items.filter((b) => b.status !== BOOKING_STATUS.cancelled).reduce((s, b) => s + Number(b.kg), 0);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.label}>Mode de transport</Text>
      <ModeChips
        value={filter.transport}
        onChange={(transport) => setFilter({ transport, tripId: '' })}
        allLabel="Tous"
      />

      {filter.transport !== '' && (
        <>
          <Text style={styles.label}>Départ</Text>
          <View style={styles.chips}>
            <TouchableOpacity onPress={() => setFilter({ ...filter, tripId: '' })} style={[styles.chip, { borderColor: colors.primary }, !filter.tripId && { backgroundColor: surface.primary }]}>
              <Text style={[styles.chipText, { color: !filter.tripId ? colors.white : colors.primary }]}>Tous les départs</Text>
            </TouchableOpacity>
            {trips.map((t) => (
              <TouchableOpacity key={t.id} onPress={() => setFilter({ ...filter, tripId: t.id })} style={[styles.chip, { borderColor: colors.primary }, filter.tripId === t.id && { backgroundColor: surface.primary }]}>
                <Text style={[styles.chipText, { color: filter.tripId === t.id ? colors.white : colors.primary }]}>
                  {t.from} → {t.to} · {isoToFr(t.date)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {items.length} réservation{items.length > 1 ? 's' : ''}
          {activeTrip ? ` · ${activeTrip.from} → ${activeTrip.to}` : ''}
          {' · '}{kg(totalKg)} kg hors annulations
        </Text>
      </View>

      {items.length === 0 ? (
        <EmptyState icon="receipt-outline" title="Aucune réservation" subtitle="Les réservations des clients apparaîtront ici." />
      ) : items.map((b) => {
        const st = STATUS_LABEL[b.status] || STATUS_LABEL[BOOKING_STATUS.pending];
        return (
          <View key={b.id} style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.ref}>{b.ref}</Text>
              <Badge label={st.label} color={st.color} />
            </View>
            <Text style={styles.cardTitle}>{b.firstName} {b.lastName}</Text>
            <Text style={styles.cardMeta}>Tél : {b.phone}{b.email ? ` · ${b.email}` : ''}</Text>
            {!!b.city && <Text style={styles.cardMeta}>Ville : {b.city}</Text>}
            <Text style={styles.cardMeta}>
              {b.trip ? `${b.trip.from} → ${b.trip.to} (${isoToFr(b.trip.date)})` : 'Départ supprimé'} · {kg(b.kg)} kg · {money(b.total)}
            </Text>
            <Text style={styles.cardMeta}>{b.userId ? 'Client avec compte' : 'Visiteur sans compte'}</Text>
            {!!b.note && <Text style={styles.note}>« {b.note} »</Text>}
            <View style={styles.actions}>
              {b.status !== BOOKING_STATUS.confirmed && (
                <SmallBtn label="Confirmer" icon="checkmark-outline" ok onPress={() => setStatus(b, BOOKING_STATUS.confirmed)} />
              )}
              {b.status !== BOOKING_STATUS.cancelled && (
                <SmallBtn label="Annuler" icon="close-outline" danger onPress={() => confirmAction('Annuler cette réservation ?', () => setStatus(b, BOOKING_STATUS.cancelled))} />
              )}
              {b.status === BOOKING_STATUS.cancelled && (
                <SmallBtn label="Remettre en attente" icon="refresh-outline" onPress={() => setStatus(b, BOOKING_STATUS.pending)} />
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

function ModeTag({ transport }) {
  const m = MODE_META[transport] || MODE_META.Avion;
  return (
    <View style={[styles.modeTag, { backgroundColor: m.color + '1F' }]}>
      <Ionicons name={m.icon} size={13} color={m.color} />
      <Text style={[styles.modeTagText, { color: m.color }]}>{m.label}</Text>
    </View>
  );
}

function Badge({ label, color }) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

function SmallBtn({ label, icon, onPress, danger, ok }) {
  const color = danger ? colors.red : ok ? colors.green : colors.primary;
  return (
    <TouchableOpacity onPress={onPress} style={[styles.smallBtn, { borderColor: color }]}>
      <Ionicons name={icon} size={15} color={color} />
      <Text style={[styles.smallBtnText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: surface.bg },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.lg, marginVertical: spacing.sm },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.primary, backgroundColor: surface.card,
  },
  tabActive: { backgroundColor: surface.primary },
  tabText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  content: { padding: spacing.lg, paddingBottom: 40 },
  label: { fontSize: 13, color: colors.text, fontWeight: '700', marginBottom: 8 },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.lg },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 11, borderRadius: radius.sm, borderWidth: 1.5, backgroundColor: surface.card,
  },
  modeBtnText: { fontWeight: '800', fontSize: 13 },
  chips: { flexDirection: 'row', gap: 8, marginBottom: spacing.lg, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 18, borderWidth: 1, backgroundColor: surface.card },
  chipText: { fontWeight: '700', fontSize: 12 },
  summary: { backgroundColor: surface.primaryLight, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.md },
  summaryText: { color: colors.primaryDark, fontWeight: '700', fontSize: 13 },
  card: {
    backgroundColor: surface.card, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: colors.primaryDark, marginTop: 6 },
  cardMeta: { fontSize: 13, color: colors.muted, marginTop: 3, lineHeight: 19 },
  ref: { fontSize: 14, fontWeight: '900', color: colors.primary, letterSpacing: 1 },
  note: { fontSize: 13, color: colors.text, fontStyle: 'italic', marginTop: 6 },
  modeTag: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  modeTagText: { fontSize: 12, fontWeight: '800' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.md },
  smallBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 7,
  },
  smallBtnText: { fontWeight: '700', fontSize: 13 },
});
