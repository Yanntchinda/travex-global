import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../theme/theme';
import { useLanguage } from '../context/LanguageContext';
import { CITIES } from '../data/mockData';

const CAT_ICON = {
  aliments: 'restaurant-outline',
  electronique: 'hardware-chip-outline',
  document: 'document-text-outline',
  vetement: 'shirt-outline',
  medicament: 'medkit-outline',
};
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=400';

function CategoryBadge({ category }) {
  const { t } = useLanguage();
  const cat = category || (Array.isArray(category) && category[0]) || 'document';
  return (
    <View style={styles.catBadge}>
      <Ionicons name={CAT_ICON[cat] || 'cube-outline'} size={11} color={colors.primary} />
      <Text style={styles.catBadgeText}>{t('cat.' + cat)}</Text>
    </View>
  );
}

// Carte de demande d'expédition (clone du modèle interface_demandes_de_colis.html)
export function DemandCard({ demand, onPress, onPropose }) {
  const { t } = useLanguage();
  const isUrgent = demand.urgency === 'urgent';
  const weightNeeded = Number(demand.weightNeeded ?? demand.weight ?? demand.capacityKg) || 0;
  const budgetPerKg = Number(demand.budgetPerKg ?? demand.pricePerKg ?? demand.price) || 0;
  const sender = demand.sender || {
    name: demand.userName || 'Expéditeur',
    avatar: null,
    verified: false,
    rating: demand.rating || 0,
    dealsCount: demand.dealsCount || 0,
  };
  const deadline = demand.deadline || demand.fromDate || demand.date || '';

  return (
    <View style={styles.card}>
      {/* Badges du haut : urgence + catégorie */}
      <View style={styles.topBadges}>
        <View style={[styles.urgencyPill, { backgroundColor: isUrgent ? '#FEF2F2' : colors.inputBg, borderColor: isUrgent ? '#FECACA' : colors.border }]}>
          <Text style={[styles.urgencyText, { color: isUrgent ? '#B91C1C' : colors.muted }]}>
            {isUrgent ? t('demand.urgent') : t('demand.flexible')}
          </Text>
        </View>
        <CategoryBadge category={demand.category} />
      </View>

      {/* Aperçu du colis : image + titre + date limite */}
      <View style={styles.parcelRow}>
        <Image source={{ uri: demand.parcelImage || DEFAULT_IMG }} style={styles.parcelImg} resizeMode="cover" />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={styles.parcelTitle} numberOfLines={2}>
            {demand.title || t('demand.parcelTitle')}
          </Text>
          <Text style={styles.deliverBefore}>
            {t('demand.deliverBefore')} : <Text style={{ color: colors.text, fontWeight: '700' }}>{deadline}</Text>
          </Text>
        </View>
      </View>

      {/* Timeline route : Départ --- destination */}
      <View style={styles.routeBox}>
        <View style={styles.routeEnd}>
          <Text style={styles.routeLabel}>{(CITIES[demand.from]?.flag ? CITIES[demand.from].flag + ' ' : '')}{t('publish.from')}</Text>
          <Text style={styles.routeCity}>{CITIES[demand.from]?.name ?? demand.from}</Text>
        </View>
        <View style={styles.routeMid}>
          <View style={styles.midDotDepart} />
          <View style={styles.midLine} />
          <Ionicons name="airplane" size={16} color={colors.primary} />
          <View style={styles.midLine} />
          <View style={styles.midDotArrival} />
        </View>
        <View style={[styles.routeEnd, { alignItems: 'flex-end' }]}>
          <Text style={styles.routeLabel}>{(CITIES[demand.to]?.flag ? CITIES[demand.to].flag + ' ' : '')}{t('publish.to')}</Text>
          <Text style={styles.routeCity}>{CITIES[demand.to]?.name ?? demand.to}</Text>
        </View>
      </View>

      {/* Poids + tarif */}
      <View style={styles.summaryBox}>
        <View>
          <Text style={styles.summaryLabel}>{t('demand.weightNeeded')}</Text>
          <Text style={styles.summaryValue}>{weightNeeded} {t('announce.kg')}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.summaryLabel}>{t('demand.budgetRate')}</Text>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>{budgetPerKg} € <Text style={[styles.perKg, { color: colors.muted, fontWeight: '400' }]}>/ {t('announce.kg')}</Text></Text>
        </View>
      </View>

      {/* Barre expéditeur */}
      <View style={styles.senderBar}>
        <View style={styles.senderLeft}>
          {sender.avatar ? (
            <Image source={{ uri: sender.avatar }} style={styles.senderAvatar} />
          ) : (
            <View style={[styles.senderAvatar, styles.senderAvatarFallback]}>
              <Text style={styles.senderInitials}>{(sender.name || 'E').trim().charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={{ marginLeft: spacing.sm }}>
            <Text style={styles.senderName}>
              {sender.name}
              {sender.verified && <Ionicons name="checkmark-circle" size={12} color="#059669" style={{ marginLeft: 4 }} />}
            </Text>
            <Text style={styles.senderRating}>
              <Ionicons name="star" size={11} color="#F5A623" /> {Number(sender.rating || 0).toFixed(1)}
              <Text style={styles.senderDeals}> ({Number(sender.dealsCount || 0)})</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* Boutons : Détails + Proposer */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={onPress}>
          <Ionicons name="eye-outline" size={14} color={colors.text} />
          <Text style={[styles.btnText, { color: colors.text }]}>{t('demand.view')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onPropose}>
          <Text style={styles.btnTextPrimary}>{t('demand.propose')}</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, borderRadius: 24, padding: spacing.lg,
    marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  topBadges: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  urgencyPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  urgencyText: { fontSize: 11, fontWeight: '800' },
  catBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#EFF6FF', borderColor: '#DBEAFE', borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  catBadgeText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  parcelRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  parcelImg: { width: 64, height: 64, borderRadius: 16, backgroundColor: colors.border },
  parcelTitle: { fontSize: 14, fontWeight: '800', color: colors.text, lineHeight: 19 },
  deliverBefore: { fontSize: 12, color: colors.muted, marginTop: 6, fontWeight: '600' },
  routeBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F7F9FB', padding: spacing.md, borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.md,
  },
  routeEnd: { flex: 1 },
  routeLabel: { fontSize: 9, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  routeCity: { fontSize: 13, fontWeight: '800', color: colors.text, marginTop: 3 },
  routeMid: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  midDotDepart: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#1D4ED8' },
  midDotArrival: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981' },
  midLine: { width: 22, height: 2, backgroundColor: colors.border },
  summaryBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F7F9FB', padding: spacing.md, borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.md,
  },
  summaryLabel: { fontSize: 10, fontWeight: '600', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { fontSize: 16, fontWeight: '900', color: colors.text, marginTop: 3 },
  perKg: { fontSize: 11, fontWeight: '600' },
  senderBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, marginBottom: spacing.md,
  },
  senderLeft: { flexDirection: 'row', alignItems: 'center' },
  senderAvatar: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primaryLight },
  senderAvatarFallback: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.primary },
  senderInitials: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  senderName: { fontSize: 12, fontWeight: '800', color: colors.text, flexDirection: 'row', alignItems: 'center' },
  senderRating: { fontSize: 11, color: '#F5A623', fontWeight: '700', marginTop: 2 },
  senderDeals: { color: colors.muted, fontWeight: '400' },
  actions: { flexDirection: 'row', gap: 8 },
  btn: {
    flex: 1, height: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
  },
  btnGhost: { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border },
  btnPrimary: { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  btnText: { fontSize: 12, fontWeight: '800' },
  btnTextPrimary: { color: colors.white, fontSize: 12, fontWeight: '800' },
});
