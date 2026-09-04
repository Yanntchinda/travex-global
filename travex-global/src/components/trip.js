import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../theme/theme';
import { CITIES } from '../data/mockData';
import { Badge, Stars } from './common';

export function CountryFlag({ city }) {
  const c = CITIES[city];
  return <Text style={{ fontSize: 18 }}>{c ? c.flag : '🌍'}</Text>;
}

export function TransportIcon({ transport }) {
  const name = transport === 'Avion' ? 'airplane' : 'car';
  return <Ionicons name={name} size={18} color="#31547B" />;
}

// Ligne de route : Douala -> Genève avec point de départ et drapeau d'arrivée
export function RouteLine({ from, to, fromDate, toDate, transport }) {
  return (
    <View style={styles.routeRow}>
      <View style={styles.routeLeft}>
        <View style={styles.timeline}>
          <View style={styles.pinDot} />
          <View style={styles.line} />
          <Ionicons name="flag" size={16} color={colors.red} />
        </View>
        <View style={{ marginLeft: spacing.md }}>
          <View style={styles.cityRow}>
            <CountryFlag city={from} />
            <Text style={styles.city}>{CITIES[from]?.name ?? from}</Text>
          </View>
          <Text style={styles.date}>{fromDate}</Text>
          <View style={[styles.cityRow, { marginTop: spacing.sm }]}>
            <CountryFlag city={to} />
            <Text style={styles.city}>{CITIES[to]?.name ?? to}</Text>
          </View>
          <Text style={styles.date}>{toDate}</Text>
        </View>
      </View>
      <View style={styles.transportCol}>
        <TransportIcon transport={transport} />
        <Text style={styles.transportText}>{transport || 'Voiture'}</Text>
      </View>
    </View>
  );
}

// Badges des services (Documents, Colis, Valise...)
export function ServiceRow({ item }) {
  const iconMap = {
    document: 'document-text-outline',
    package: 'cube-outline',
    valise: 'briefcase-outline',
  };
  return (
    <View style={styles.serviceRow}>
      <Ionicons name={iconMap[item.icon] || 'cube-outline'} size={20} color={colors.primary} />
      <Text style={styles.serviceTitle}>{item.title}</Text>
      <Text style={styles.servicePrice}>{item.price}</Text>
      {item.extra && <Text style={styles.serviceExtra}>{item.extra}</Text>}
      {item.count && <Text style={styles.serviceCount}>{item.count}</Text>}
    </View>
  );
}

export function Traveler({ traveler }) {
  return (
    <View style={styles.traveler}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{traveler.initials}</Text>
      </View>
      <View style={{ marginLeft: spacing.md }}>
        <Text style={styles.travelerName}>{traveler.name}</Text>
        <View style={styles.badgeRow}>
          <Badge label={traveler.badge || 'Voyageur'} color={colors.green} icon="checkmark-circle" />
        </View>
      </View>
    </View>
  );
}

// Carte complète d'un voyage (accueil)
export function TripCard({ trip, onPress, onShare }) {
  return (
    <TouchableOpacity activeOpacity={0.95} onPress={onPress} style={styles.card}>
      <View style={styles.cardHeader}>
        {trip.isNew && (
          <View style={{ alignSelf: 'flex-end' }}>
            <Badge label="NOUVEAU" color={colors.orange} />
          </View>
        )}
      </View>

      <RouteLine
        from={trip.from}
        to={trip.to}
        fromDate={trip.fromDate}
        toDate={trip.toDate}
        transport={trip.transport}
      />

      <Text style={styles.departLabel}>{trip.departLabel}</Text>

      <View style={styles.services}>
        {trip.services && trip.services.map((s, i) => <ServiceRow key={i} item={s} />)}
      </View>

      <View style={styles.divider} />

      <View style={styles.footer}>
        <Traveler traveler={trip.traveler} />
        <TouchableOpacity
          onPress={onShare}
          style={styles.shareBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="share-social-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.detailsBtn}>
        <Text style={styles.detailsText}>Voir les détails</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  cardHeader: { alignItems: 'flex-end', marginBottom: spacing.sm },
  routeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  routeLeft: { flexDirection: 'row' },
  timeline: { alignItems: 'center', width: 18 },
  pinDot: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: colors.primary, marginTop: 2,
  },
  line: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 3, minHeight: 22 },
  cityRow: { flexDirection: 'row', alignItems: 'center' },
  city: { fontSize: 17, fontWeight: '700', color: colors.text, marginLeft: 6 },
  date: { fontSize: 13, color: colors.muted, marginLeft: 24, marginTop: 2 },
  transportCol: { alignItems: 'flex-end' },
  transportText: { fontSize: 12, color: '#31547B', marginTop: 4 },
  departLabel: {
    color: colors.green, fontWeight: '700', fontSize: 15,
    marginVertical: spacing.md,
  },
  services: { marginBottom: spacing.md },
  serviceRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.inputBg,
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    borderRadius: radius.sm, marginBottom: spacing.sm,
  },
  serviceTitle: { fontSize: 15, fontWeight: '600', color: colors.muted, flex: 1, marginLeft: spacing.sm },
  servicePrice: { fontSize: 15, fontWeight: '700', color: colors.primary },
  serviceExtra: { fontSize: 13, color: colors.muted, marginLeft: 6 },
  serviceCount: { fontSize: 13, fontWeight: '700', color: colors.primary, marginLeft: 8 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  traveler: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.primary,
  },
  avatarText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  travelerName: { fontSize: 15, fontWeight: '600', color: colors.text },
  badgeRow: { flexDirection: 'row', marginTop: 4 },
  shareBtn: { padding: 6 },
  detailsBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsText: { color: colors.white, fontWeight: '700', fontSize: 15 },
});
