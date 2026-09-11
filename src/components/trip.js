import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow, TRANSPORT_MODES } from '../theme/theme';
import { CITIES } from '../data/mockData';
import { useLanguage } from '../context/LanguageContext';

const FLAG = { '🇨🇲': '🇨🇲' };

export function CountryFlag({ city }) {
  const c = CITIES[city];
  return <Text style={{ fontSize: 18 }}>{c ? c.flag : '🌍'}</Text>;
}

function modeInfo(transport) {
  const m = TRANSPORT_MODES.find((x) => x.key === transport);
  return m || { icon: 'cube-outline', color: colors.primary, key: transport || 'Autre' };
}

export function TransportIcon({ transport, size = 18 }) {
  const m = modeInfo(transport);
  return <Ionicons name={m.icon} size={size} color={m.color} />;
}

export function TransportBadge({ transport }) {
  const m = modeInfo(transport);
  return (
    <View style={[styles.transportBadge, { backgroundColor: m.color + '1A' }]}>
      <Ionicons name={m.icon} size={13} color={m.color} />
      <Text style={[styles.transportBadgeText, { color: m.color }]}>{m.key}</Text>
    </View>
  );
}

// Ligne de route à deux jalons (départ bleu / arrivée vert) — style modèle
export function RouteLine({ from, to, fromDate, toDate, transport, compact = false, showTransport = true }) {
  return (
    <View style={styles.routeBox}>
      <View style={styles.routeLeft}>
        <View style={styles.timeline}>
          <View style={styles.pinDot} />
          <View style={styles.line} />
          <View style={styles.pinDotArrival} />
        </View>
        <View style={{ marginLeft: spacing.md, flex: 1 }}>
          <View style={styles.cityRow}>
            <CountryFlag city={from} />
            <Text style={styles.city}>{CITIES[from]?.name ?? from}</Text>
          </View>
          <Text style={styles.date}>{fromDate} · Départ</Text>
          <View style={[styles.cityRow, { marginTop: spacing.sm }]}>
            <CountryFlag city={to} />
            <Text style={styles.city}>{CITIES[to]?.name ?? to}</Text>
          </View>
          <Text style={styles.date}>{toDate} · Arrivée</Text>
        </View>
      </View>
      {showTransport && (
        <View style={styles.transportCol}>
          <TransportBadge transport={transport} />
        </View>
      )}
    </View>
  );
}

// Étiquettes de catégories (pills vertes, style modèle)
const CAT_ICON = {
  aliments: 'restaurant-outline',
  electronique: 'hardware-chip-outline',
  document: 'document-text-outline',
  vetement: 'shirt-outline',
  medicament: 'medkit-outline',
};

export function CategoryChips({ categories }) {
  const { t } = useLanguage();
  if (!categories || categories.length === 0) return null;
  return (
    <View style={styles.catWrap}>
      {categories.map((c) => (
        <View key={c} style={styles.catChip}>
          <Ionicons name={CAT_ICON[c] || 'cube-outline'} size={11} color="#059669" />
          <Text style={styles.catText}>{t('cat.' + c)}</Text>
        </View>
      ))}
    </View>
  );
}

// Prix par kg
export function PricePerKg({ pricePerKg, big = false }) {
  const { t } = useLanguage();
  if (!pricePerKg || Number(pricePerKg) <= 0) return null;
  return (
    <Text style={[styles.priceBig, big && { fontSize: 24 }]}>
      {(Number(pricePerKg)).toFixed(0)}{' '}
      <Text style={styles.priceUnit}>€ / {t('announce.kg')}</Text>
    </Text>
  );
}

// Jauge de capacité : barre réservé (gris) + disponible (brand).
//  variant 'card'  -> étiquettes "X kg total" / "X kg réservé"
//  variant 'modal' -> étiquettes "X kg au total" / "X kg restants"
export function CapacityGauge({ totalKg, bookedKg, variant = 'card' }) {
  const { t } = useLanguage();
  const total = Number(totalKg) || 0;
  const booked = Number(bookedKg) || 0;
  const remaining = Math.max(0, total - booked);
  const reservedPercent = total ? Math.round((booked / total) * 100) : 0;
  const availPercent = 100 - reservedPercent;
  const isModal = variant === 'modal';
  return (
    <View style={styles.gaugeWrap}>
      <View style={styles.gaugeTrack}>
        <View style={[styles.gaugeReserved, { width: `${reservedPercent}%` }]} />
        <View style={[styles.gaugeAvail, { width: `${availPercent}%` }]} />
      </View>
      <View style={[styles.gaugeRowBottom, isModal && { marginTop: 6 }]}>
        <Text style={[styles.gaugeLabel, isModal && styles.gaugeModalLeft]}>
          {total} {t('announce.kg')} {isModal ? t('announce.kgTotal') : t('announce.total')}
        </Text>
        <Text style={[styles.gaugeLabel, isModal && styles.gaugeModalRemaining]}>
          {isModal ? remaining : booked} {t('announce.kg')} {isModal ? t('announce.remaining') : t('announce.booked')}
        </Text>
      </View>
    </View>
  );
}

// Barre transporteur (avatar, nom, note) — style modèle
export function Traveler({ traveler }) {
  return (
    <View style={styles.travelerRow}>
      <View style={styles.avatar}>
        {traveler.avatar ? (
          <Image source={{ uri: traveler.avatar }} style={styles.avatarImg} />
        ) : (
          <Text style={styles.avatarText}>{traveler.initials}</Text>
        )}
      </View>
      <View style={{ marginLeft: spacing.md, flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.travelerName}>{traveler.name}</Text>
          {traveler.verified && (
            <View style={styles.verifiedSmall}>
              <Ionicons name="shield-checkmark" size={11} color="#059669" />
              <Text style={styles.verifiedSmallText}>Vérifié</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
          <Ionicons name="star" size={13} color="#F5A623" />
          <Text style={styles.travelerScore}>{(traveler.rating || 0).toFixed(1)}</Text>
          <Text style={styles.travelerReviews}>({traveler.reviews || 0})</Text>
        </View>
      </View>
    </View>
  );
}

// Carte complète d'un voyage (accueil) — cartes "journey" style modèle
export function TripCard({ trip, onPress, onShare }) {
  const { t } = useLanguage();
  const remaining = Math.max(0, (trip.capacityKg || 0) - (trip.bookedKg || 0));
  const m = modeInfo(trip.transport);
  return (
    <TouchableOpacity activeOpacity={0.96} onPress={onPress} style={styles.card}>
      {/* Badges du haut : statut + mode */}
      <View style={styles.topBadges}>
        <View style={[styles.badgePill, { backgroundColor: trip.status === 'attente' ? '#B7791F' : trip.status === 'confirme' ? '#059669' : '#F59E0B' }]}>
          <Text style={styles.badgePillText}>
            {trip.status === 'attente' ? t('publish.pending') : trip.status === 'confirme' ? t('publish.verified') : trip.isDemande ? 'Demande' : trip.badge || 'Nouveau'}
          </Text>
        </View>
        <View style={styles.modePill}>
          <Ionicons name={m.icon} size={13} color={m.color} />
          <Text style={styles.modePillText}>{trip.transport}</Text>
        </View>
      </View>

      {/* Timeline de route (le mode est déjà dans la pastille du haut -> pas de doublon) */}
      <RouteLine from={trip.from} to={trip.to} fromDate={trip.fromDate} toDate={trip.toDate} transport={trip.transport} showTransport={false} />

      {/* Étiquettes catégories */}
      <CategoryChips categories={trip.categories} />

      {/* Prix/kg + jauge de capacité */}
      <View style={styles.priceGaugeBox}>
        <PricePerKg pricePerKg={trip.pricePerKg} />
        {!trip.isDemande ? (
          <CapacityGauge totalKg={trip.capacityKg} bookedKg={trip.bookedKg} />
        ) : null}
      </View>

      {/* Barre transporteur + CTA */}
      <View style={styles.travelerBar}>
        <Traveler traveler={trip.traveler} />
      </View>
      <View style={styles.detailsBtn}>
        <Text style={styles.detailsText}>{trip.isDemande ? "Voir la demande" : t('announce.details')}</Text>
        <Ionicons name="arrow-forward" size={16} color={colors.white} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, borderRadius: 24, padding: spacing.lg,
    marginBottom: spacing.lg, marginHorizontal: '2.5%', borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  topBadges: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  badgePill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  badgePillText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  modePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.inputBg, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  modePillText: { fontSize: 13, fontWeight: '700', color: colors.text },
  routeBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  routeLeft: { flexDirection: 'row', flex: 1 },
  timeline: { alignItems: 'center', width: 14, marginTop: 4 },
  pinDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginTop: 2 },
  pinDotArrival: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#059669', marginTop: 8 },
  line: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 2, minHeight: 24 },
  cityRow: { flexDirection: 'row', alignItems: 'center' },
  city: { fontSize: 17, fontWeight: '800', color: colors.text, marginLeft: 6 },
  date: { fontSize: 12, color: colors.muted, marginLeft: 24, marginTop: 2 },
  transportCol: { alignItems: 'flex-end' },
  transportBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  transportBadgeText: { fontSize: 12, fontWeight: '700', marginLeft: 4 },
  catWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#ECFDF5', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5, marginRight: spacing.sm, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: '#D1FAE5',
  },
  catText: { color: '#059669', fontSize: 12, fontWeight: '600' },
  priceGaugeBox: {
    backgroundColor: colors.inputBg, borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.md,
  },
  priceBig: { fontSize: 26, fontWeight: '900', color: colors.text },
  priceUnit: { fontSize: 13, fontWeight: '600', color: colors.muted },
  gaugeWrap: { marginTop: spacing.sm },
  gaugeRowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  gaugeTotal: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  gaugeRemaining: { fontSize: 12, color: colors.primary, fontWeight: '800' },
  gaugeTrack: { height: 10, borderRadius: 5, overflow: 'hidden', flexDirection: 'row', backgroundColor: colors.border },
  gaugeReserved: { backgroundColor: '#94A3B8' },
  gaugeAvail: { backgroundColor: colors.primary, flex: 1 },
  gaugeRowBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  gaugeLabel: { fontSize: 11, color: colors.muted },
  gaugeModalLeft: { fontSize: 12, fontWeight: '600' },
  gaugeModalRemaining: { fontSize: 12, fontWeight: '800', color: colors.primary },
  travelerBar: {
    backgroundColor: colors.inputBg, borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.md,
  },
  travelerRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.primary,
  },
  avatarText: { color: colors.primary, fontWeight: '800', fontSize: 15 },
  avatarImg: { width: 42, height: 42, borderRadius: 21 },
  travelerName: { fontSize: 14, fontWeight: '700', color: colors.text },
  verifiedSmall: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8, marginLeft: 6 },
  verifiedSmallText: { color: '#059669', fontSize: 10, fontWeight: '700' },
  travelerScore: { color: colors.text, fontWeight: '800', fontSize: 12, marginLeft: 4 },
  travelerReviews: { color: colors.muted, fontSize: 11, marginLeft: 3 },
  detailsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, borderRadius: radius.md, height: 50, gap: 8,
  },
  detailsText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
