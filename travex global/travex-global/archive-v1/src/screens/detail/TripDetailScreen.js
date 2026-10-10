import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { ScreenHeader, Stars, Badge, Loading, Button, RatingInput } from '../../components/common';
import { CountryFlag, TransportIcon, RouteLine, CategoryChips, PricePerKg, CapacityGauge } from '../../components/trip';
import Slider from '../../components/Slider';
import { fetchTripDetail, bookKg, rateTarget, ensureConversation } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Gate from '../../components/Gate';

function OptionSheet({ visible, onClose }) {
  const options = [
    { icon: 'person-outline', label: 'Voir le profil' },
    { icon: 'share-social-outline', label: 'Partager l\u2019annonce' },
    { icon: 'eye-off-outline', label: 'Masquer l\u2019annonce' },
    { icon: 'flag-outline', label: 'Signaler l\u2019utilisateur', danger: true },
  ];
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          {options.map((o, i) => (
            <TouchableOpacity key={i} style={styles.optionRow} onPress={() => onClose()}>
              <Ionicons name={o.icon} size={22} color={o.danger ? colors.red : colors.primary} />
              <Text style={[styles.optionText, o.danger && { color: colors.red }]}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function TripDetailScreen({ route, navigation }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { id } = route.params;
  const [detail, setDetail] = useState(null);
  const [sheet, setSheet] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookedInfo, setBookedInfo] = useState(null); // modale de confirmation in-app
  const [selKg, setSelKg] = useState(5);
  const [ratingValue, setRatingValue] = useState(0);
  const [rated, setRated] = useState(false);

  const loadDetail = () => { fetchTripDetail(id).then(setDetail).catch(() => {}); };
  useEffect(() => { loadDetail(); }, [id]);

  if (!detail) return <Loading />;

  // Modèle "transparence" : les détails nécessitent un compte.
  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title={t('announce.details')} onBack={() => navigation.goBack()} />
        <Gate
          icon="lock-closed-outline"
          title={t('announce.gate')}
          subtitle={t('announce.gateDesc')}
          onLogin={() => navigation.navigate('SignIn')}
        />
      </SafeAreaView>
    );
  }

  const r = detail.route || {
    from: detail.from, to: detail.to,
    fromDate: detail.fromDate, toDate: detail.toDate, transport: detail.transport,
  };
  const { traveler } = detail;
  const prohibited = (detail.prohibited && detail.prohibited.length) ? detail.prohibited : [];
  const notice = detail.notice || '';
  const capacity = detail.capacityKg || 0;
  const booked = detail.bookedKg || 0;
  const remaining = Math.max(0, detail.remainingKg ?? capacity - booked);
  const pricePerKg = detail.pricePerKg || 0;
  const isDemande = !!detail.isDemande;

  // Clampe le kg sélectionné dans la limite restante.
  const safeKg = Math.max(1, Math.min(selKg, Math.max(1, remaining)));

  const confirmBook = async () => {
    const kg = safeKg;
    setBooking(true);
    try {
      const res = await bookKg(id, kg, {
        pricePerKg,
        from: r.from, to: r.to, date: r.fromDate, transport: r.transport,
        userName: traveler.name,
      });
      // Confirmation in-app (fiable sur web + mobile) au lieu d'Alert no-op.
      setBookedInfo({ kg, total: res.reservation.total, remaining: res.remaining });
      loadDetail(); // recharge les kg réservés
    } catch (e) {
      Alert.alert(t('announce.bookError'), e.message);
    } finally {
      setBooking(false);
    }
  };

  const submitRating = async () => {
    if (!ratingValue) {
      Alert.alert(t('rate.title'), t('rate.hint'));
      return;
    }
    const res = await rateTarget(detail.travelerId || id, ratingValue);
    setRated(true);
    setRatingValue(0);
    // Met à jour immédiatement les étoiles / la moyenne (elles "s'allument" à chaque avis).
    setDetail((prev) => (prev ? { ...prev, traveler: { ...prev.traveler, rating: res.average, reviews: res.count } } : prev));
    loadDetail();
  };

  const total = safeKg * pricePerKg;

  // Ouvre une conversation persistée avec le transporteur puis ouvre CE chat dans Messages.
  const openContact = async () => {
    if (traveler) {
      const convo = await ensureConversation({
        name: traveler.name || 'Voyageur',
        initials: traveler.initials,
        last: t('announce.contact'),
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      });
      navigation.navigate('Main', { screen: 'Messages', params: { openConvoId: convo.id } });
    } else {
      navigation.navigate('Main', { screen: 'Messages' });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={t('announce.details')} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Transporteur */}
        <View style={styles.card}>
          <View style={styles.travelerRow}>
            <View style={styles.avatar}>
              {traveler.avatar ? (
                <Image source={{ uri: traveler.avatar }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarText}>{traveler.initials}</Text>
              )}
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.travelerName}>{traveler.name}</Text>
                {traveler.verified && (
                  <View style={styles.verifiedSmall}><Ionicons name="shield-checkmark" size={11} color="#059669" /><Text style={styles.verifiedSmallText}>Vérifié</Text></View>
                )}
              </View>
              <View style={styles.ratingRow}>
                <Stars value={traveler.rating || 0} size={16} />
                <Text style={styles.reviews}>{(traveler.rating || 0).toFixed(1)} · {traveler.reviews} {t('rate.reviews')}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setSheet(true)} style={styles.moreBtn}>
              <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Trajet */}
        <View style={styles.card}>
          <RouteLine from={r.from} to={r.to} fromDate={r.fromDate} toDate={r.toDate} transport={r.transport} />
          <View style={styles.directRow}>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            <Text style={styles.directText}>{t('announce.direct')}</Text>
          </View>
        </View>

        {/* Tarif / kg + jauge + calculateur */}
        <View style={styles.estimatorCard}>
          <View style={styles.estHead}>
            <Text style={styles.estLabel}>{t('announce.pricePerKgLabel')}</Text>
            <PricePerKg pricePerKg={pricePerKg} big />
          </View>

          {/* Barre de progression */}
          <CapacityGauge totalKg={capacity} bookedKg={booked} variant="modal" />

          {!isDemande && remaining > 0 && (
            <>
              <View style={styles.estDivider} />
              <View style={styles.estRow}>
                <Text style={styles.estLabelSmall}>{t('announce.simulate')} :</Text>
                <Text style={styles.estKg}>{safeKg} {t('announce.kg')}</Text>
              </View>
              <Slider min={1} max={Math.max(1, remaining)} value={safeKg} onChange={setSelKg} fillColor={colors.primary} thumbColor={colors.primary} />
              <View style={styles.estTotalRow}>
                <Text style={styles.estTotalLabel}>{t('announce.estimatedTotal')}</Text>
                <Text style={styles.estTotal}>{total} €</Text>
              </View>
              <Button
                title={t('announce.bookTrip')}
                icon="cube-outline"
                onPress={confirmBook}
                loading={booking}
                style={{ marginTop: spacing.md }}
              />
            </>
          )}
        </View>

        {/* Catégories */}
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="pricetags-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>{t('announce.category')}</Text>
          </View>
          <CategoryChips categories={detail.categories} />
        </View>

        {/* Message du transporteur */}
        {detail.description ? (
          <View style={styles.card}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="chatbox-ellipses-outline" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>{t('announce.description')}</Text>
            </View>
            <Text style={styles.notice}>{detail.description}</Text>
          </View>
        ) : null}

        {/* Noter avec étoiles */}
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="star-outline" size={20} color={colors.star} />
            <Text style={styles.sectionTitle}>{t('rate.title')}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
            <Stars value={traveler.rating || 0} size={20} />
            <Text style={styles.rateScore}>{(traveler.rating || 0).toFixed(1)} / 5 · {traveler.reviews || 0} {t('rate.reviews')}</Text>
          </View>
          <Text style={styles.rateHint}>{t('rate.hint')}</Text>
          <RatingInput value={ratingValue} onChange={(v) => { setRatingValue(v); setRated(false); }} size={34} />
          <Button title={rated ? t('rate.thankyou') : t('rate.submit')} icon="star" onPress={submitRating} style={{ marginTop: spacing.md }} />
        </View>

        {prohibited.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="ban-outline" size={20} color={colors.red} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('announce.prohibited')}</Text>
            </View>
            <View style={styles.prohibitedWrap}>
              {prohibited.map((p, i) => (
                <View key={i} style={styles.prohibited}>
                  <Ionicons name="close" size={14} color={colors.red} />
                  <Text style={styles.prohibitedText}>{p}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {notice ? (
          <View style={styles.card}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="alert-circle" size={20} color={colors.red} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('announce.notice')}</Text>
            </View>
            <Text style={styles.notice}>{notice}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.actionBar}>
        <Button title={t('announce.contact')} variant="green" icon="chatbubbles-outline" onPress={openContact} style={{ flex: 1, marginRight: spacing.sm }} />
        <Button
          title={isDemande ? 'Répondre' : t('announce.bookTrip')}
          icon={isDemande ? 'mail-outline' : 'cube-outline'}
          onPress={isDemande ? () => navigation.navigate('Main', { screen: 'Messages' }) : confirmBook}
          loading={booking}
          style={{ flex: 1, marginLeft: spacing.sm }}
        />
      </View>

      <OptionSheet visible={sheet} onClose={() => setSheet(false)} />

      {/* Confirmation de réservation in-app */}
      <Modal transparent visible={!!bookedInfo} animationType="fade" onRequestClose={() => setBookedInfo(null)}>
        <TouchableOpacity style={styles.bookOverlay} activeOpacity={1} onPress={() => setBookedInfo(null)}>
          <View style={styles.bookModal}>
            <View style={styles.bookIcon}><Ionicons name="checkmark" size={30} color={colors.white} /></View>
            <Text style={styles.bookTitle}>{t('announce.bookSuccess')}</Text>
            <Text style={styles.bookSub}>{bookedInfo?.kg} {t('announce.kg')} × {pricePerKg} €/{t('announce.kg')} = <Text style={{ fontWeight: '900' }}>{bookedInfo?.total} €</Text></Text>
            <Text style={styles.bookRemaining}>{bookedInfo?.remaining} {t('announce.kg')} {t('announce.remaining')}</Text>
            <View style={styles.bookActions}>
              <Button title={t('announce.contact')} variant="outline" icon="chatbubbles-outline" onPress={() => { setBookedInfo(null); openContact(); }} style={{ flex: 1, marginRight: spacing.sm }} />
              <Button title={t('booking.title')} icon="checkmark-done-outline" onPress={() => { setBookedInfo(null); navigation.navigate('Main', { screen: 'Réservations' }); }} style={{ flex: 1, marginLeft: spacing.sm }} />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  travelerRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.primary,
  },
  avatarText: { color: colors.primary, fontWeight: '800', fontSize: 18 },
  avatarImg: { width: 56, height: 56, borderRadius: 28 },
  travelerName: { fontSize: 18, fontWeight: '700', color: colors.text },
  verifiedSmall: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#ECFDF5', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, marginLeft: 8 },
  verifiedSmallText: { color: '#059669', fontSize: 11, fontWeight: '700' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  reviews: { fontSize: 13, color: colors.muted, marginLeft: 6 },
  moreBtn: { padding: 8 },
  directRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.sm },
  directText: { fontSize: 13, color: colors.primary, fontWeight: '700' },
  estimatorCard: {
    backgroundColor: '#F0F6FF', borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: '#E0EDFF',
  },
  estHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  estLabel: { fontSize: 13, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  estDivider: { height: 1, backgroundColor: '#E0EDFF', marginTop: spacing.md, marginBottom: spacing.md },
  estRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  estLabelSmall: { fontSize: 13, fontWeight: '700', color: colors.text },
  estKg: { fontSize: 16, fontWeight: '900', color: colors.primary },
  estTotalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.md, backgroundColor: colors.white, borderRadius: radius.sm,
    padding: spacing.md, borderWidth: 1, borderColor: '#E0EDFF',
  },
  estTotalLabel: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  estTotal: { fontSize: 22, fontWeight: '900', color: colors.text },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.primaryDark, marginLeft: 8 },
  prohibitedWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  prohibited: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FBEAEA', borderRadius: radius.sm,
    paddingHorizontal: spacing.md, paddingVertical: 10, margin: 4,
  },
  prohibitedText: { color: colors.red, fontWeight: '600', marginLeft: 6, fontSize: 13 },
  notice: { fontSize: 15, color: colors.text, lineHeight: 23 },
  rateScore: { fontSize: 15, color: colors.text, fontWeight: '700', marginLeft: spacing.sm },
  rateHint: { fontSize: 14, color: colors.muted, marginBottom: spacing.md },
  actionBar: {
    flexDirection: 'row', padding: spacing.lg, backgroundColor: colors.white,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg, paddingBottom: spacing.xxl,
  },
  sheetHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.lg },
  optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  optionText: { fontSize: 16, color: colors.primaryDark, marginLeft: spacing.lg, fontWeight: '600' },
  bookOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  bookModal: { width: '100%', maxWidth: 360, backgroundColor: colors.white, borderRadius: 24, padding: spacing.xl, alignItems: 'center' },
  bookIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  bookTitle: { fontSize: 18, fontWeight: '900', color: colors.text, marginTop: spacing.md },
  bookSub: { fontSize: 15, color: colors.text, marginTop: spacing.sm, textAlign: 'center' },
  bookRemaining: { fontSize: 13, color: colors.green, fontWeight: '700', marginTop: 6 },
  bookActions: { flexDirection: 'row', marginTop: spacing.xl, width: '100%' },
});
