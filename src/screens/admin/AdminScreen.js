import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ScrollView as SV } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { ScreenHeader, Badge, Button } from '../../components/common';
import { CategoryChips } from '../../components/trip';
import {
  fetchAllAnnouncements, setAnnouncementStatus,
  fetchPendingUsers, verifyUser,
} from '../../services/supabase';
import { useLanguage } from '../../context/LanguageContext';
import AppModal from '../../components/AppModal';
import CniDocsView from '../../components/CniDocsView';

export default function AdminScreen({ navigation }) {
  const { t } = useLanguage();
  const [tab, setTab] = useState('annonces'); // 'annonces' | 'profils'
  const [items, setItems] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [viewAnn, setViewAnn] = useState(null); // annonce consultée
  const [viewUser, setViewUser] = useState(null); // profil consulté

  // Bandeau de confirmation in-app (les Alert sont muets sur le web).
  const [flash, setFlash] = useState(null);
  const flashTimer = useRef(null);
  const showFlash = (msg, error = false) => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlash({ msg, error });
    flashTimer.current = setTimeout(() => setFlash(null), 2800);
  };

  // Toutes les publications en attente de vérification (départs ET demandes).
  const loadAnn = useCallback(async () => {
    const list = await fetchAllAnnouncements();
    setItems(list.filter((a) => a.status === 'attente'));
  }, []);
  const loadProfiles = useCallback(async () => {
    const list = await fetchPendingUsers();
    setProfiles(list);
  }, []);
  useEffect(() => { loadAnn(); loadProfiles(); }, [loadAnn, loadProfiles]);

  // Seul l'administrateur change le statut (valider / rejeter) depuis ce dashboard.
  const changeAnn = async (id, status) => {
    await setAnnouncementStatus(id, status);
    showFlash(`${status === 'confirme' ? t('admin.validated') : t('admin.rejected')} — ${t('admin.updated')}`, status !== 'confirme');
    setViewAnn(null);
    loadAnn();
  };

  const verify = async (id) => {
    await verifyUser(id);
    showFlash(`${t('admin.verified')} — ${t('admin.updated')}`);
    setViewUser(null);
    loadProfiles();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={t('admin.title')} onBack={() => navigation.goBack()}
        rightIcon="log-out-outline" onRight={() => navigation.goBack()} />

      {/* Confirmation d'action (in-app) */}
      {flash && (
        <View style={[styles.flash, flash.error && styles.flashError]}>
          <Ionicons name={flash.error ? 'close-circle' : 'checkmark-circle'} size={18} color={flash.error ? colors.red : colors.green} />
          <Text style={[styles.flashText, flash.error && { color: colors.red }]}>{flash.msg}</Text>
        </View>
      )}

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'annonces' && styles.tabActive]} onPress={() => setTab('annonces')}>
          <Text style={[styles.tabText, tab === 'annonces' && styles.tabTextActive]}>
            {t('admin.pubToConfirm')}{items.length > 0 ? ` (${items.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'profils' && styles.tabActive]} onPress={() => setTab('profils')}>
          <Text style={[styles.tabText, tab === 'profils' && styles.tabTextActive]}>
            {t('admin.profilesToVerify')}{profiles.length > 0 ? ` (${profiles.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {tab === 'annonces' ? (
          items.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="checkmark-done-circle-outline" size={56} color={colors.primary} />
              <Text style={styles.emptyText}>{t('admin.none')}</Text>
            </View>
          ) : items.map((a) => (
            <View key={a.id} style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {a.isDemande ? (
                  <View style={[styles.iconBox, { backgroundColor: colors.accentLight }]}><Ionicons name="trending-up" size={18} color={colors.accent} /></View>
                ) : (
                  <View style={styles.iconBox}><Ionicons name="airplane" size={18} color={colors.primary} /></View>
                )}
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.route}>{a.from} → {a.to}</Text>
                  <Text style={styles.meta}>{a.transport ? a.transport + ' · ' : ''}{a.date} · {a.userName || '—'}</Text>
                  {a.price && <Text style={styles.price}>{a.isDemande ? t('admin.budget') : t('admin.rate')} : {a.price}</Text>}
                </View>
              </View>
              <Badge label={t('publish.pending')} color="#F0E6D2" textColor="#8A5B12" icon="time" />

              <View style={styles.actions}>
                <TouchableOpacity style={styles.viewBtn} onPress={() => setViewAnn(a)}>
                  <Ionicons name="eye-outline" size={16} color={colors.primary} />
                  <Text style={styles.viewText}>{t('admin.viewDetail')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.approveBtn} onPress={() => changeAnn(a.id, 'confirme')}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  <Text style={styles.approveText}>{t('admin.validate')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => changeAnn(a.id, 'rejete')}>
                  <Ionicons name="close" size={16} color={colors.red} />
                  <Text style={styles.rejectText}>{t('admin.reject')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          profiles.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={56} color={colors.primary} />
              <Text style={styles.emptyText}>{t('admin.noProfiles')}</Text>
            </View>
          ) : profiles.map((u) => (
            <View key={u.id} style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.profileAvatar}><Text style={styles.profileAvatarText}>{u.initials || '?'}</Text></View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.route}>{u.firstName} {u.lastName}</Text>
                  <Text style={styles.meta}>{u.email} · {u.location || '—'}</Text>
                  <Text style={styles.meta}>{u.phone || '—'}</Text>
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.viewBtn} onPress={() => setViewUser(u)}>
                  <Ionicons name="eye-outline" size={16} color={colors.primary} />
                  <Text style={styles.viewText}>{t('admin.viewReferences')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.approveBtn} onPress={() => verify(u.id)}>
                  <Ionicons name="shield-checkmark-outline" size={16} color="#fff" />
                  <Text style={styles.approveText}>{t('admin.verifyProfile')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal détails d'une annonce (billet, catégories, tarif) */}
      <AppModal transparent visible={!!viewAnn} animationType="slide" onRequestClose={() => setViewAnn(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setViewAnn(null)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{t('admin.viewDetail')}</Text>
            {viewAnn && (
              <SV showsVerticalScrollIndicator={false}>
                <Text style={styles.sheetRoute}>{viewAnn.from} → {viewAnn.to}</Text>
                <Text style={styles.sheetMeta}>
                  {viewAnn.transport ? viewAnn.transport + ' · ' : ''}{viewAnn.date} · {viewAnn.userName || '—'}
                </Text>
                {viewAnn.price && (
                  <Text style={styles.sheetPrice}>
                    {viewAnn.isDemande ? t('admin.budget') : t('admin.rate')} : {viewAnn.price}
                  </Text>
                )}
                {viewAnn.capacityKg > 0 && (
                  <Text style={styles.sheetLine}>{t('admin.capacity')} : {viewAnn.capacityKg} {t('announce.kg')}</Text>
                )}
                {viewAnn.categories && viewAnn.categories.length > 0 && (
                  <>
                    <Text style={styles.sheetLine}>{t('admin.categories')}</Text>
                    <CategoryChips categories={viewAnn.categories} />
                  </>
                )}
                {viewAnn.description ? (
                  <>
                    <Text style={styles.sheetLine}>{t('admin.message')}</Text>
                    <Text style={styles.sheetBody}>{viewAnn.description}</Text>
                  </>
                ) : null}
                {/* Photo du billet — pièce consultée par l'administrateur avant validation */}
                <View style={styles.ticketHead}>
                  <Ionicons name="document-attach-outline" size={16} color={colors.primaryDark} />
                  <Text style={styles.sheetLine}>{t('admin.ticket')}</Text>
                </View>
                {viewAnn.ticketPhoto ? (
                  <Image source={{ uri: viewAnn.ticketPhoto }} style={styles.ticketImg} resizeMode="contain" />
                ) : viewAnn.parcelImage ? (
                  <Image source={{ uri: viewAnn.parcelImage }} style={styles.ticketImg} resizeMode="contain" />
                ) : (
                  <Text style={styles.sheetNoImg}>{t('admin.ticket')} : —</Text>
                )}
              </SV>
            )}
            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.approveBtn} onPress={() => changeAnn(viewAnn.id, 'confirme')}>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={styles.approveText}>{t('admin.validate')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => changeAnn(viewAnn.id, 'rejete')}>
                <Ionicons name="close" size={16} color={colors.red} />
                <Text style={styles.rejectText}>{t('admin.reject')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </AppModal>

      {/* Modal détails d'un profil (références + CNI) */}
      <AppModal transparent visible={!!viewUser} animationType="slide" onRequestClose={() => setViewUser(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setViewUser(null)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{t('admin.references')}</Text>
            {viewUser && (
              <SV showsVerticalScrollIndicator={false}>
                <Text style={styles.sheetRoute}>{viewUser.firstName} {viewUser.lastName}</Text>
                <Text style={styles.sheetMeta}>{viewUser.email}</Text>
                <Text style={styles.sheetMeta}>{viewUser.phone || '—'}</Text>
                <Text style={styles.sheetMeta}>{viewUser.location || '—'}</Text>

                {/* 3 documents d'identité : recto, verso, selfie avec la CNI.
                    Visibles en plein écran et téléchargeables. */}
                <Text style={styles.sheetLine}>{t('admin.docs')}</Text>
                <CniDocsView user={viewUser} />
              </SV>
            )}
            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.approveBtn} onPress={() => verify(viewUser.id)}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#fff" />
                <Text style={styles.approveText}>{t('admin.verifyProfile')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </AppModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, marginHorizontal: '5%' },
  tab: { flex: 1, height: 48, alignItems: 'center', justifyContent: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: colors.primary },
  tabText: { fontSize: 14, color: colors.text },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
  list: { paddingHorizontal: '5%', paddingTop: spacing.lg, paddingBottom: spacing.lg },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.sm, ...shadow.card },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  profileAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  profileAvatarText: { color: colors.primary, fontWeight: '800', fontSize: 16 },
  route: { fontSize: 16, fontWeight: '800', color: colors.text },
  meta: { fontSize: 12, color: colors.muted, marginTop: 3 },
  price: { fontSize: 13, fontWeight: '700', color: colors.primary, marginTop: 4 },
  actions: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm },
  viewBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 42, borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.primary, gap: 6, backgroundColor: colors.card },
  viewText: { color: colors.primary, fontWeight: '700' },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.green, height: 42, borderRadius: radius.sm, gap: 6 },
  approveText: { color: '#fff', fontWeight: '700' },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FBEAEA', height: 42, borderRadius: radius.sm, gap: 6 },
  rejectText: { color: colors.red, fontWeight: '700' },
  flash: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#E7F6EE', borderRadius: radius.md, margin: spacing.lg,
    marginBottom: 0, padding: spacing.md, borderWidth: 1, borderColor: '#BFE8D2',
  },
  flashError: { backgroundColor: '#FDECEC', borderColor: '#F5C7C7' },
  flashText: { flex: 1, color: colors.green, fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', marginTop: spacing.xxl },
  emptyText: { color: colors.muted, marginTop: spacing.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg, paddingBottom: spacing.xxl, maxHeight: '80%',
  },
  sheetHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.lg },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  sheetRoute: { fontSize: 20, fontWeight: '800', color: colors.text },
  sheetMeta: { fontSize: 14, color: colors.muted, marginTop: 4 },
  sheetPrice: { fontSize: 15, color: colors.primary, fontWeight: '800', marginTop: 6 },
  sheetLine: { fontSize: 14, color: colors.primaryDark, fontWeight: '700', marginTop: spacing.md },
  ticketHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ticketImg: { width: '100%', height: 220, borderRadius: radius.md, marginTop: spacing.sm, backgroundColor: colors.inputBg },
  sheetBody: { fontSize: 14, color: colors.text, marginTop: 4, lineHeight: 21 },
  sheetNoImg: { fontSize: 13, color: colors.muted, marginTop: 4 },

  sheetActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
});
