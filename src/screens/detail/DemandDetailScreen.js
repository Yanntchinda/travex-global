import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { ScreenHeader, Button, Loading, Input } from '../../components/common';
import { createProposal, fetchTripDetail } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { CITIES } from '../../data/mockData';
import AppModal from '../../components/AppModal';
import AccountRequiredModal from '../../components/AccountRequiredModal';

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=400';

function ProposalModal({ demand, visible, onClose, onSubmit, submitting }) {
  const { t } = useLanguage();
  const [date, setDate] = useState('');
  const [kg, setKg] = useState('');
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (visible) {
      setKg(String(demand.weightNeeded || ''));
      setPrice(String(demand.budgetPerKg || ''));
    }
  }, [visible, demand]);

  const submit = () => {
    if (!date.trim() || !kg.trim() || !price.trim()) {
      Alert.alert(t('demand.offerTitle'), t('demand.offerRequired'));
      return;
    }
    onSubmit({ date: date.trim(), kg, pricePerKg: price, message: message.trim() });
  };

  return (
    <AppModal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHead}>
            <View style={styles.sheetHeadTitle}>
              <Ionicons name="paper-plane" size={18} color={colors.primary} />
              <Text style={styles.sheetTitle}>{t('demand.offerTitle')}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.sheetBody} showsVerticalScrollIndicator={false}>
            {/* Colis cible */}
            <View style={styles.targetBox}>
              <Text style={styles.targetLabel}>{t('demand.title')}</Text>
              <Text style={styles.targetTitle}>{demand.title || t('demand.parcelTitle')}</Text>
              <View style={styles.targetRow}>
                <Text style={styles.targetItem}>{t('demand.weightReq')} : <Text style={styles.targetStrong}>{demand.weightNeeded} {t('announce.kg')}</Text></Text>
                <Text style={styles.targetItem}>{t('demand.budgetRate')} : <Text style={[styles.targetStrong, { color: colors.primary }]}>{demand.budgetPerKg} € / {t('announce.kg')}</Text></Text>
              </View>
            </View>

            <Input label={t('demand.offerTravelDate')} icon="calendar-outline" placeholder="JJ.MM.AAAA" value={date} onChangeText={setDate} />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Input label={t('demand.offerWeight')} icon="scale-outline" placeholder="5" keyboardType="numeric" value={kg} onChangeText={setKg} />
              </View>
              <View style={{ flex: 1 }}>
                <Input label={t('demand.offerPrice')} icon="cash-outline" placeholder="12" keyboardType="numeric" value={price} onChangeText={setPrice} />
              </View>
            </View>
            <Text style={styles.msgLabel}>{t('demand.offerMessage')}</Text>
            <View style={styles.msgWrap}>
              <TextInput
                style={styles.msgInput}
                placeholder={t('demand.offerMessagePh')}
                placeholderTextColor="#9AA3AF"
                value={message}
                onChangeText={setMessage}
                multiline
              />
            </View>

            <Button title={t('demand.offerSubmit')} icon="paper-plane-outline" onPress={submit} loading={submitting} style={{ marginTop: spacing.md }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </AppModal>
  );
}

export default function DemandDetailScreen({ route, navigation }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { id } = route.params;
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProposal, setShowProposal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Invité : consulter la demande est libre, mais PROPOSER ses kilos (écrire
  // à l'expéditeur) exige un compte.
  const [needAccount, setNeedAccount] = useState(null);

  const load = () => {
    fetchTripDetail(id).then((d) => setDetail(d)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [id]);

  if (loading) return <Loading />;
  if (!detail) return <Loading />;

  const isUrgent = detail.urgency === 'urgent';

  const onPropose = async ({ date, kg, pricePerKg, message }) => {
    setSubmitting(true);
    try {
      await createProposal({
        demandId: id,
        date,
        kg,
        pricePerKg,
        message,
        from: detail.from, to: detail.to,
        senderName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Un voyageur',
      });
      setShowProposal(false);
      Alert.alert(t('demand.offerSubmit'), t('demand.offerSuccess'));
    } catch (e) {
      Alert.alert(t('announce.bookError'), e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={t('demand.details')} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* En-tête : badges + image + titre + échéance */}
        <View style={styles.card}>
          <View style={styles.badges}>
            <View style={[styles.urgencyPill, { backgroundColor: isUrgent ? '#FEF2F2' : colors.inputBg, borderColor: isUrgent ? '#FECACA' : colors.border }]}>
              <Text style={[styles.urgencyText, { color: isUrgent ? '#B91C1C' : colors.muted }]}>{isUrgent ? t('demand.urgent') : t('demand.flexible')}</Text>
            </View>
            <View style={styles.catBadge}>
              <Ionicons name="pricetag-outline" size={12} color={colors.primary} />
              <Text style={styles.catBadgeText}>{t('cat.' + detail.category)}</Text>
            </View>
          </View>

          <View style={styles.parcelTop}>
            <Image source={{ uri: detail.parcelImage || DEFAULT_IMG }} style={styles.parcelImg} resizeMode="cover" />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.parcelTitle}>{detail.title || t('demand.parcelTitle')}</Text>
              <Text style={styles.deadline}>
                {t('demand.deadline')} : <Text style={{ color: colors.text, fontWeight: '800' }}>{detail.deadline}</Text>
              </Text>
            </View>
          </View>

          {/* Bandeau route */}
          <View style={styles.routeBanner}>
            <View>
              <Text style={styles.routeLabel}>{t('publish.from')}</Text>
              <Text style={styles.routeCity}>{(CITIES[detail.from]?.flag ? CITIES[detail.from].flag + ' ' : '')}{CITIES[detail.from]?.name ?? detail.from}</Text>
            </View>
            <View style={styles.routeMid}>
              <View style={styles.midDotDepart} />
              <View style={styles.midLine} />
              <Ionicons name="airplane" size={16} color={colors.primary} />
              <View style={styles.midLine} />
              <View style={styles.midDotArrival} />
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.routeLabel}>{t('publish.to')}</Text>
              <Text style={styles.routeCity}>{(CITIES[detail.to]?.flag ? CITIES[detail.to].flag + ' ' : '')}{CITIES[detail.to]?.name ?? detail.to}</Text>
            </View>
          </View>

          {/* Poids requis + tarif proposé */}
          <View style={styles.finBox}>
            <View style={styles.finCol}>
              <Text style={styles.finLabel}>{t('demand.weightReq')}</Text>
              <Text style={styles.finValue}>{detail.weightNeeded} {t('announce.kg')}</Text>
            </View>
            <View style={styles.finDivider} />
            <View style={[styles.finCol, { alignItems: 'center' }]}>
              <Text style={styles.finLabel}>{t('demand.budgetRate')}</Text>
              <Text style={[styles.finValue, { color: colors.primary }]}>{detail.budgetPerKg} € / {t('announce.kg')}</Text>
            </View>
          </View>
        </View>

        {/* Description du contenu */}
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="align-left" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>{t('demand.description')}</Text>
          </View>
          {detail.description ? (
            <Text style={styles.descText}>{detail.description}</Text>
          ) : (
            <Text style={styles.descText}>{detail.title || t('demand.parcelTitle')}</Text>
          )}
        </View>

        {/* Profil expéditeur */}
        <View style={styles.card}>
          <View style={styles.senderRow}>
            {detail.sender.avatar ? (
              <Image source={{ uri: detail.sender.avatar }} style={styles.senderAvatar} />
            ) : (
              <View style={[styles.senderAvatar, styles.senderAvatarFallback]}>
                <Text style={styles.senderInitials}>{(detail.sender.name || 'E').trim().charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.senderName}>
                {detail.sender.name}
                {detail.sender.verified && <Ionicons name="checkmark-circle" size={14} color="#059669" style={{ marginLeft: 5 }} />}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Ionicons name="star" size={12} color="#F5A623" />
                <Text style={styles.senderRating}>{Number(detail.sender.rating || 0).toFixed(1)}</Text>
                <Text style={styles.senderDeals}> ({Number(detail.sender.dealsCount || 0)} {t('demand.deals')})</Text>
              </View>
              {/* Demande publiée SANS compte : coordonnées laissées par l'invité.
                  Le téléphone n'est visible que des utilisateurs CONNECTÉS —
                  un visiteur non identifié ne peut pas le récolter. */}
              {!!detail.guestPhone && user && (
                <View style={styles.guestContactRow}>
                  <Ionicons name="call-outline" size={13} color="#047857" />
                  <Text style={styles.guestContact}>{detail.guestPhone}</Text>
                  <View style={styles.guestChip}>
                    <Ionicons name="person-circle-outline" size={11} color={colors.muted} />
                    <Text style={styles.guestChipText}>{t('publish.guestBadge')}</Text>
                  </View>
                </View>
              )}
              {!!detail.guestPhone && !user && (
                <View style={styles.guestContactRow}>
                  <Ionicons name="lock-closed-outline" size={13} color={colors.muted} />
                  <Text style={styles.guestContactHidden}>{t('demand.contactHidden')}</Text>
                </View>
              )}
            </View>
            {detail.sender.verified && (
              <View style={styles.verifiedChip}>
                <Ionicons name="user-check" size={12} color="#059669" />
                <Text style={styles.verifiedChipText}>{t('demand.senderVerified')}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Barre d'action : Fermer + Proposer mes kilos */}
      <View style={styles.actionBar}>
        <Button title={t('demand.close')} variant="outline" onPress={() => navigation.goBack()} style={{ flex: 1, marginRight: spacing.sm }} />
        <Button
          title={t('demand.proposeKilos')}
          icon="hand-left-outline"
          onPress={() => (user ? setShowProposal(true) : setNeedAccount(t('account.requiredPropose')))}
          style={{ flex: 1.6, marginLeft: spacing.sm }}
        />
      </View>

      {/* Invité : proposer exige un compte (la consultation reste libre) */}
      <AccountRequiredModal
        visible={!!needAccount}
        onClose={() => setNeedAccount(null)}
        onLogin={() => { setNeedAccount(null); navigation.navigate('SignIn'); }}
        message={needAccount}
      />

      <ProposalModal demand={detail} visible={showProposal} onClose={() => setShowProposal(false)} onSubmit={onPropose} submitting={submitting} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: '5%', paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  badges: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  urgencyPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  urgencyText: { fontSize: 11, fontWeight: '800' },
  catBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EFF6FF', borderColor: '#DBEAFE', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  catBadgeText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  parcelTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  parcelImg: { width: 96, height: 96, borderRadius: 18, backgroundColor: colors.border },
  parcelTitle: { fontSize: 16, fontWeight: '800', color: colors.text, lineHeight: 22 },
  deadline: { fontSize: 12, color: colors.muted, marginTop: 8, fontWeight: '600' },
  routeBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F7F9FB', padding: spacing.md, borderRadius: 18, borderWidth: 1, borderColor: colors.border,
  },
  routeLabel: { fontSize: 10, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  routeCity: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 3 },
  routeMid: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  midDotDepart: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#1D4ED8' },
  midDotArrival: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981' },
  midLine: { width: 24, height: 2, backgroundColor: colors.border },
  finBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#EFF6FF', borderRadius: 18, padding: spacing.lg, marginTop: spacing.md,
    borderWidth: 1, borderColor: '#DBEAFE',
  },
  finCol: { flex: 1, alignItems: 'center' },
  finDivider: { width: 1, height: 40, backgroundColor: '#DBEAFE' },
  finLabel: { fontSize: 10, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  finValue: { fontSize: 16, fontWeight: '900', color: colors.text, marginTop: 5 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginLeft: 8 },
  descText: { fontSize: 14, color: colors.text, lineHeight: 22 },
  senderRow: { flexDirection: 'row', alignItems: 'center' },
  senderAvatar: { width: 52, height: 52, borderRadius: 14, backgroundColor: colors.primaryLight },
  senderAvatarFallback: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primary },
  senderInitials: { color: colors.primary, fontWeight: '800', fontSize: 18 },
  senderName: { fontSize: 15, fontWeight: '800', color: colors.text, flexDirection: 'row', alignItems: 'center' },
  senderRating: { color: '#F5A623', fontWeight: '800', fontSize: 13, marginLeft: 4 },
  senderDeals: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  // Coordonnées d'un expéditeur invité (demande publiée sans compte)
  guestContactRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  guestContact: { color: '#047857', fontSize: 13, fontWeight: '800' },
  guestContactHidden: { color: colors.muted, fontSize: 12, fontWeight: '600', fontStyle: 'italic' },
  guestChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.inputBg, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3,
  },
  guestChipText: { color: colors.muted, fontSize: 10.5, fontWeight: '800' },
  verifiedChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10 },
  verifiedChipText: { color: '#059669', fontSize: 11, fontWeight: '800' },
  actionBar: {
    flexDirection: 'row', padding: spacing.lg, backgroundColor: colors.card,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '88%' },
  sheetHandle: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.sm, marginTop: spacing.sm },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  sheetHeadTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sheetTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.inputBg, alignItems: 'center', justifyContent: 'center' },
  sheetBody: { padding: spacing.lg, paddingBottom: spacing.xxl },
  targetBox: { backgroundColor: '#F7F9FB', borderRadius: 16, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  targetLabel: { fontSize: 10, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  targetTitle: { fontSize: 13, fontWeight: '800', color: colors.text, marginTop: 6 },
  targetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  targetItem: { fontSize: 12, color: colors.muted },
  targetStrong: { fontWeight: '800', color: colors.text },
  msgLabel: { fontSize: 13, fontWeight: '800', color: colors.text, marginBottom: 6 },
  msgWrap: { backgroundColor: colors.inputBg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  msgInput: { minHeight: 90, padding: spacing.md, fontSize: 14, color: colors.text, textAlignVertical: 'top' },
});
