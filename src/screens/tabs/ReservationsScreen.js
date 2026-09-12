import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { EmptyState } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getShipments, setShipmentStatus } from '../../services/supabase';
import AppModal from '../../components/AppModal';

const AVATARS = {
  'Sophie M.': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
  'Erick T.': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
};

const STATUS_MAP = {
  pending: { key: 'track.readyPickup', bg: '#FEF3E2', text: '#92600C', border: '#FADDB8', icon: 'time' },
  in_transit: { key: 'track.scanned', bg: '#EFF6FF', text: '#1D4ED8', border: '#DBEAFE', icon: 'airplane' },
  landed: { key: 'track.landed', bg: '#ECFDF5', text: '#047857', border: '#A7F3D0', icon: 'checkmark-circle' },
  delivered: { key: 'track.deliveredSuccess', bg: '#ECFDF5', text: '#047857', border: '#A7F3D0', icon: 'checkmark-done' },
};

function CloseBtn({ onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={c.closeBtn}>
      <Ionicons name="close" size={18} color={colors.muted} />
    </TouchableOpacity>
  );
}

// ---------- Modale Scanner (caméra + galerie) ----------
function ScannerModal({ visible, onClose, onScan, shipment }) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const runScan = (msg) => {
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      onClose();
      onScan();
      Alert.alert(t('track.validatePickup'), t('track.scanOk'));
    }, 900);
  };
  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.6,
      });
      if (!result.canceled && result.assets && result.assets[0]) runScan();
    } catch (e) {
      // Sur web/sandbox la galerie n'est pas toujours disponible : démo.
      runScan();
    }
  };
  const camera = async () => {
    try {
      await ImagePicker.requestCameraPermissionsAsync();
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.5 });
      if (!result.canceled && result.assets && result.assets[0]) runScan();
      else runScan();
    } catch (e) {
      // La caméra n'est pas disponible (web / sandbox) : démo.
      runScan();
    }
  };

  return (
    <AppModal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={c.scanOverlay}>
        <View style={c.scanCard}>
          <CloseBtn onPress={onClose} />
          <Text style={c.scanTitle}>{t('track.validatePickup')}</Text>
          <Text style={c.scanSub}>{t('track.scanDesc')}</Text>
          {shipment && shipment.ref ? (
            <View style={c.expectedBox}>
              <Ionicons name="qr-code" size={16} color={colors.primary} />
              <Text style={c.expectedLabel}>{t('track.scanExpected')}</Text>
              <Text style={c.expectedRef}>{shipment.ref}</Text>
            </View>
          ) : null}
          <View style={c.scanFrame}>
            <Text style={c.scanFrameText}>{busy ? t('track.scanAnalyze') : t('track.scanning')}</Text>
            <Ionicons name="qr-code" size={64} color="#4B5563" />
          </View>
          <TouchableOpacity style={c.scanBtn} onPress={camera} activeOpacity={0.85}>
            <Ionicons name="camera" size={18} color={colors.white} />
            <Text style={c.scanBtnText}>{t('track.scanCamera')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={c.scanBtnGhost} onPress={pickImage} activeOpacity={0.85}>
            <Ionicons name="image" size={18} color={colors.primary} />
            <Text style={c.scanBtnGhostText}>{t('track.importImage')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AppModal>
  );
}

// ---------- Modale Saisie du PIN ----------
function PinModal({ visible, onClose, onValidate }) {
  const { t } = useLanguage();
  const [digits, setDigits] = useState('');
  const refs = useRef([]);
  useEffect(() => { if (visible) { setDigits(''); setTimeout(() => refs.current[0]?.focus(), 100); } }, [visible]);
  const commit = (val) => {
    setDigits(val);
    if (val.length === 4) refs.current.forEach((r) => r && r.blur());
  };
  const validate = () => {
    if (digits.length !== 4) {
      Alert.alert(t('track.pinModalTitle'), t('track.pinInvalid'));
      return;
    }
    onClose();
    onValidate(digits);
    Alert.alert(t('track.deliveredSuccess'), t('track.pinOk'));
  };
  return (
    <AppModal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={c.scanOverlay}>
        <View style={c.pinCard}>
          <CloseBtn onPress={onClose} />
          <View style={c.pinIcon}><Ionicons name="key" size={20} color={colors.green} /></View>
          <Text style={c.scanTitle}>{t('track.pinModalTitle')}</Text>
          <Text style={c.scanSub}>{t('track.pinModalDesc')}</Text>
          <View style={c.pinRow}>
            {[0, 1, 2, 3].map((i) => (
              <TextInput
                key={i}
                ref={(el) => (refs.current[i] = el)}
                value={digits[i] || ''}
                onChangeText={(v) => {
                  const clean = v.replace(/[^0-9]/g, '').slice(-1);
                  const next = digits.split('');
                  next[i] = clean;
                  const joined = next.join('').slice(0, 4);
                  commit(joined);
                  if (clean && i < 3) refs.current[i + 1]?.focus();
                  if (clean && i === 3) refs.current[i]?.blur();
                }}
                onKeyPress={({ nativeEvent }) => { if (nativeEvent.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus(); }}
                maxLength={1}
                keyboardType="number-pad"
                style={[c.pinInput, digits[i] && c.pinInputFilled]}
              />
            ))}
          </View>
          <TouchableOpacity style={c.pinBtn} onPress={validate} activeOpacity={0.85}>
            <Ionicons name="checkmark-circle" size={18} color={colors.white} />
            <Text style={c.pinBtnText}>{t('track.pinValidate')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AppModal>
  );
}

// ---------- Modale QR Code & Partage ----------
function QrModal({ visible, onClose, shipment }) {
  const { t } = useLanguage();
  if (!shipment) return null;
  return (
    <AppModal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={c.scanOverlay}>
        <View style={c.qrCard}>
          <CloseBtn onPress={onClose} />
          <Text style={c.scanTitle}>{t('track.qrModalTitle')}</Text>
          <Text style={c.scanSub}>{t('track.qrModalDesc')}</Text>
          <View style={c.qrBox}>
            <QRCode value={shipment.qrData || 'GP-SAFE-0000'} size={150} color="#0035B8" backgroundColor="#F8FAFC" />
            <Text style={c.qrLabel}>{t('track.qrParcelRef')}</Text>
            <Text style={c.qrRef}>{shipment.ref}</Text>
          </View>
          <View style={c.qrHintBox}>
            <Ionicons name="information-circle" size={16} color="#1D4ED8" />
            <Text style={c.qrHintText}>{t('track.qrHint')}</Text>
          </View>
          <View style={c.qrActions}>
            <TouchableOpacity style={c.qrGhost} onPress={() => Alert.alert(t('track.download'), t('track.savedGallery'))}>
              <Ionicons name="download" size={16} color={colors.text} />
              <Text style={c.qrGhostText}>{t('track.download')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={c.qrPrimary} onPress={() => Alert.alert(t('track.share'), t('track.shareLink'))}>
              <Ionicons name="share-social" size={16} color={colors.white} />
              <Text style={c.qrPrimaryText}>{t('track.share')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </AppModal>
  );
}

// ---------- Modale Chat direct ----------
function ChatModal({ visible, onClose, name }) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState([{ me: false, text: 'Bonjour ! Où souhaitez-vous que nous nous retrouvions pour la remise du colis ?' }]);
  const [draft, setDraft] = useState('');
  const listRef = useRef(null);
  const inputRef = useRef(null);
  useEffect(() => {
    setMessages([{ me: false, text: 'Bonjour ! Où souhaitez-vous que nous nous retrouvions pour la remise du colis ?' }]);
    setDraft('');
    // Curseur placé automatiquement sur la zone de saisie à l'ouverture.
    if (visible) {
      const timer = setTimeout(() => inputRef.current?.focus(), 350);
      return () => clearTimeout(timer);
    }
  }, [visible]);
  const send = () => {
    if (!draft.trim()) return;
    setMessages((m) => [...m, { me: true, text: draft.trim() }]);
    setDraft('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
  };
  return (
    <AppModal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={c.chatOverlay}>
        <View style={c.chatCard}>
          <View style={c.chatHead}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={c.chatDot} />
              <Text style={c.chatName}>{name || t('track.traveler')}</Text>
            </View>
            <CloseBtn onPress={onClose} />
          </View>
          <ScrollView ref={listRef} style={c.chatBody} contentContainerStyle={{ padding: spacing.lg, alignItems: 'stretch' }}
            keyboardShouldPersistTaps="handled">
            {messages.map((m, i) => (
              <View key={i} style={[c.bubbleRow, { justifyContent: m.me ? 'flex-end' : 'flex-start' }]}>
                <View style={[c.bubble, { backgroundColor: m.me ? colors.primary : colors.white }, m.me ? { borderTopRightRadius: 4 } : { borderTopLeftRadius: 4 }]}>
                  <Text style={[c.bubbleText, { color: m.me ? colors.white : colors.text }]}>{m.text}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={c.chatInputRow}>
            <TextInput
              ref={inputRef}
              style={c.chatInput}
              placeholder="Écrivez votre message..."
              placeholderTextColor="#9AA3AF"
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={send}
            />
            <TouchableOpacity style={c.chatSend} onPress={send} activeOpacity={0.85}>
              <Ionicons name="paper-plane" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </AppModal>
  );
}

// ---------- Carte d'un colis ----------
function ShipmentCard({ item, onViewQR, onChat, onScan, onEnterPin }) {
  const { t } = useLanguage();
  const sm = STATUS_MAP[item.status] || STATUS_MAP.pending;
  const isLanded = item.status === 'landed' || item.status === 'delivered';
  const counterparty = item.role === 'sender'
    ? { label: t('track.traveler'), person: item.counterparty }
    : { label: item.status === 'landed' || item.status === 'delivered' ? t('track.recipient') : t('track.sender'), person: item.counterparty };
  const avatarUri = AVATARS[item.counterparty?.name] || item.counterparty?.avatar;

  return (
    <View style={cc.card}>
      {/* Header */}
      <View style={cc.header}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <View style={[cc.statusBadge, { backgroundColor: sm.bg, borderColor: sm.border }]}>
            <View style={[cc.statusDot, { backgroundColor: sm.bg }]} />
            <Text style={[cc.statusText, { color: sm.text }]}>{t(sm.key)}</Text>
          </View>
          <Text style={cc.ref}>{t('track.ref')} : #{item.ref}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={cc.counterAvatar} />
          ) : (
            <View style={[cc.counterAvatar, cc.counterAvatarFallback]}>
              <Text style={cc.counterInitials}>{(counterparty.person?.name || '?').trim().charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={cc.roleLabel}>{counterparty.label}</Text>
            <Text style={cc.roleName}>{counterparty.person?.name || '—'}</Text>
          </View>
        </View>
      </View>

      {/* Parcel + route */}
      <View style={cc.midBox}>
        <View style={cc.parcelLeft}>
          <View style={cc.parcelIcon}><Ionicons name="archive" size={22} color={colors.text} /></View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={cc.parcelName} numberOfLines={1}>{item.parcel}</Text>
            <Text style={cc.parcelWeight}><Ionicons name="scale" size={11} color={colors.muted} /> {t('track.weight')} : <Text style={{ fontWeight: '800', color: colors.text }}>{item.weight} {t('announce.kg')}</Text></Text>
            {/* Prix de la réservation : tarif au kilo et total */}
            {item.pricePerKg > 0 && (
              <Text style={cc.parcelPrice}>
                {item.pricePerKg} € / {t('announce.kg')}
                {item.total > 0 ? ` · ${t('booking.total')} : ` : ''}
                {item.total > 0 ? <Text style={cc.parcelTotal}>{item.total} €</Text> : null}
              </Text>
            )}
          </View>
        </View>
        <View style={cc.routePill}>
          <View style={cc.routeEnd}>
            <Text style={cc.routeLabel}>{t('publish.from')}</Text>
            <Text style={cc.routeCity}>{item.from} ({item.fromCode})</Text>
          </View>
          <View style={cc.routeMid}>
            <Ionicons name={item.status === 'delivered' ? 'checkmark' : 'airplane'} size={14} color={item.status === 'delivered' ? colors.green : '#059669'} />
            <View style={cc.routeLine} />
            <Text style={cc.routeState}>{item.status === 'delivered' ? t('track.flightDone') : item.status === 'in_transit' ? t('track.enTransit') : t('track.flightDone')}</Text>
          </View>
          <View style={[cc.routeEnd, { alignItems: 'flex-end' }]}>
            <Text style={cc.routeLabel}>{t('publish.to')}</Text>
            <Text style={cc.routeCity}>{item.to} ({item.toCode})</Text>
          </View>
        </View>
      </View>

      {/* Zone PIN (expéditeur, après atterrissage) */}
      {item.role === 'sender' && isLanded && (
        <View style={cc.pinZone}>
          <View style={cc.pinIconBox}><Ionicons name="key" size={20} color={colors.white} /></View>
          <View style={{ flex: 1 }}>
            <Text style={cc.pinTitle}>{t('track.pinTitle')}</Text>
            <Text style={cc.pinDesc}>{t('track.pinDesc')}</Text>
          </View>
          <View style={cc.pinBox}>
            <Text style={cc.pinLabel}>{t('track.pinSecret')}</Text>
            <Text style={cc.pinValue}>{item.pin}</Text>
          </View>
        </View>
      )}

      {/* Actions / CTA selon le rôle */}
      {item.role === 'sender' ? (
        <View style={cc.actions}>
          <TouchableOpacity style={cc.actGhost} onPress={() => onViewQR(item)}>
            <Ionicons name="qr-code" size={16} color={colors.primary} />
            <Text style={[cc.actGhostText, { color: colors.text }]}>{t('track.viewQR')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={cc.actBrand} onPress={() => onChat(item)}>
            <Ionicons name="chatbubbles" size={16} color={colors.primary} />
            <Text style={cc.actBrandText}>{t('track.chat')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={cc.actions}>
          {item.status === 'delivered' ? (
            <View style={cc.doneChip}>
              <Ionicons name="checkmark-circle" size={16} color={colors.green} />
              <Text style={cc.doneChipText}>{t('track.deliveredSuccess')}</Text>
            </View>
          ) : item.status === 'in_transit' ? (
            <View style={cc.doneChip}>
              <Ionicons name="checkmark-circle" size={16} color="#1D4ED8" />
              <Text style={[cc.doneChipText, { color: '#1D4ED8' }]}>{t('track.scanned')}</Text>
            </View>
          ) : item.status === 'landed' ? (
            <TouchableOpacity style={[cc.actPrimary, { backgroundColor: colors.green }]} onPress={() => onEnterPin(item)}>
              <Ionicons name="key" size={16} color={colors.white} />
              <Text style={cc.actPrimaryText}>{t('track.enterPin')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={cc.actPrimary} onPress={() => onScan(item)}>
              <Ionicons name="camera" size={16} color={colors.white} />
              <Text style={cc.actPrimaryText}>{t('track.scanQR')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

export default function ReservationsScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState('my');
  const [filter, setFilter] = useState('all');
  const [scanner, setScanner] = useState(null);
  const [pinFor, setPinFor] = useState(null);
  const [qrFor, setQrFor] = useState(null);
  const [chatFor, setChatFor] = useState(null);

  const load = async () => { const s = await getShipments(); setItems(s || []); };
  useEffect(() => { load(); }, []);

  const list = items.filter((it) =>
    it.role === (tab === 'my' ? 'sender' : 'traveler') &&
    (filter === 'all'
      || (filter === 'pending' && it.status === 'pending')
      || (filter === 'inTransit' && (it.status === 'in_transit' || it.status === 'landed'))
      || (filter === 'delivered' && it.status === 'delivered'))
  );
  const senderCount = items.filter((i) => i.role === 'sender').length;
  const travelerCount = items.filter((i) => i.role === 'traveler').length;

  const onScan = async (item) => { await setShipmentStatus(item.id, 'in_transit'); load(); };
  const onEnterPin = async (item) => { await setShipmentStatus(item.id, 'delivered'); load(); };

  const filters = [
    { key: 'all', label: t('track.all') },
    { key: 'pending', label: t('track.pending') },
    { key: 'inTransit', label: t('track.inTransit') },
    { key: 'delivered', label: t('track.delivered') },
  ];

  return (
    <SafeAreaView style={c.safe} edges={['top']}>
      <View style={c.headerTitle}>
        <Text style={c.title}>{t('booking.title')}</Text>
        <Text style={c.subtitle}>{t('track.myBookings')}</Text>
      </View>

      {/* Onglets principaux */}
      <View style={c.mainTabs}>
        <TouchableOpacity style={[c.mainTab, tab === 'my' && c.mainTabActive]} onPress={() => setTab('my')}>
          <Ionicons name="archive" size={15} color={tab === 'my' ? colors.white : colors.muted} />
          <Text style={[c.mainTabText, tab === 'my' && c.mainTabTextActive]}>{t('track.myBookings')}</Text>
          <View style={[c.countPill, tab === 'my' ? c.countPillActive : c.countPillIdle]}><Text style={[c.countPillText, tab === 'my' && { color: colors.white }]}>{senderCount}</Text></View>
        </TouchableOpacity>
        <TouchableOpacity style={[c.mainTab, tab === 'traveler' && c.mainTabActive]} onPress={() => setTab('traveler')}>
          <Ionicons name="airplane" size={15} color={tab === 'traveler' ? colors.white : colors.muted} />
          <Text style={[c.mainTabText, tab === 'traveler' && c.mainTabTextActive]}>{t('track.travelerSpace')}</Text>
          <View style={[c.countPill, tab === 'traveler' ? c.countPillActive : c.countPillIdle]}><Text style={[c.countPillText, tab === 'traveler' && { color: colors.white }]}>{travelerCount}</Text></View>
        </TouchableOpacity>
      </View>

      {/* Filtres par statut */}
      <View style={c.filtersRow}>
        {filters.map((f) => (
          <TouchableOpacity key={f.key} style={[c.filterChip, filter === f.key && c.filterChipActive]} onPress={() => setFilter(f.key)}>
            <Text style={[c.filterText, filter === f.key && c.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={c.list} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {list.length === 0 ? (
          <EmptyState icon="archive-outline" title={t('track.noShipments')} subtitle={t('track.noShipmentsDesc')} />
        ) : (
          list.map((it) => (
            <ShipmentCard
              key={it.id}
              item={it}
              onViewQR={setQrFor}
              onChat={setChatFor}
              onScan={setScanner}
              onEnterPin={onEnterPin}
            />
          ))
        )}
      </ScrollView>

      <ScannerModal visible={!!scanner} onClose={() => setScanner(null)} onScan={() => onScan(scanner)} shipment={scanner} />
      <PinModal visible={!!pinFor} onClose={() => setPinFor(null)} onValidate={() => onEnterPin(pinFor)} />
      <QrModal visible={!!qrFor} onClose={() => setQrFor(null)} shipment={qrFor} />
      <ChatModal visible={!!chatFor} onClose={() => setChatFor(null)} name={chatFor?.counterparty?.name} />
    </SafeAreaView>
  );
}

const c = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  headerTitle: { paddingHorizontal: '5%', paddingTop: spacing.md, paddingBottom: spacing.sm },
  title: { fontSize: 24, fontWeight: '900', color: colors.primaryDark },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },
  mainTabs: {
    flexDirection: 'row', gap: 8, backgroundColor: colors.card, borderRadius: 18,
    padding: 6, marginHorizontal: '5%', ...shadow.card,
  },
  mainTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 46, borderRadius: 14, paddingHorizontal: 4 },
  mainTabActive: { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  mainTabText: { fontSize: 12, fontWeight: '700', color: colors.text, flexShrink: 1 },
  mainTabTextActive: { color: colors.white },
  countPill: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10, minWidth: 18, alignItems: 'center' },
  countPillActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  countPillIdle: { backgroundColor: colors.inputBg },
  countPillText: { fontSize: 11, fontWeight: '800', color: colors.muted },
  filtersRow: { flexDirection: 'row', gap: 8, paddingHorizontal: '5%', paddingVertical: spacing.md, overflow: 'hidden' },
  filterChip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  filterText: { fontSize: 12, fontWeight: '700', color: colors.muted },
  filterTextActive: { color: colors.white },
  list: { paddingHorizontal: '5%', paddingTop: spacing.lg, paddingBottom: 110 },
  scanOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.85)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  scanCard: { backgroundColor: colors.card, borderRadius: 28, width: '100%', maxWidth: 400, padding: spacing.xl, alignItems: 'center', ...shadow.card },
  scanTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: spacing.md, textAlign: 'center' },
  scanSub: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 6, marginBottom: spacing.lg, lineHeight: 18 },
  scanFrame: { width: 220, height: 220, borderRadius: 18, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: colors.primary, marginBottom: spacing.lg },
  scanFrameText: { fontSize: 11, color: colors.muted, marginTop: 8 },
  scanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 48, borderRadius: 14, backgroundColor: colors.primary, marginBottom: spacing.sm },
  scanBtnText: { color: colors.white, fontWeight: '800', fontSize: 13 },
  scanBtnGhost: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 48, borderRadius: 14, backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border },
  scanBtnGhostText: { color: colors.text, fontWeight: '800', fontSize: 13 },
  pinCard: { backgroundColor: colors.card, borderRadius: 28, width: '100%', maxWidth: 380, padding: spacing.xl, alignItems: 'center' },
  pinIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md },
  pinRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginVertical: spacing.xl },
  pinInput: { width: 52, height: 60, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.inputBg, borderRadius: 14, textAlign: 'center', fontSize: 24, fontWeight: '800', color: colors.text },
  pinInputFilled: { borderColor: colors.green, backgroundColor: '#ECFDF5' },
  pinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 50, borderRadius: 14, backgroundColor: colors.green },
  pinBtnText: { color: colors.white, fontWeight: '800', fontSize: 13 },
  qrCard: { backgroundColor: colors.card, borderRadius: 28, width: '100%', maxWidth: 380, padding: spacing.xl, alignItems: 'center' },
  qrBox: { backgroundColor: '#F8FAFC', borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, alignItems: 'center', marginVertical: spacing.lg, width: '100%' },
  qrLabel: { fontSize: 10, color: colors.muted, textTransform: 'uppercase', fontWeight: '800', letterSpacing: 0.8, marginTop: spacing.md },
  qrRef: { fontSize: 16, fontWeight: '900', color: colors.text, marginTop: 4 },
  qrHintBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EFF6FF',
    borderWidth: 1, borderColor: '#DBEAFE', borderRadius: 12,
    paddingHorizontal: spacing.md, paddingVertical: 10, marginBottom: spacing.md, width: '100%',
  },
  qrHintText: { flex: 1, fontSize: 12, color: '#1D4ED8', fontWeight: '600', lineHeight: 17 },
  expectedBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.inputBg,
    borderRadius: 12, paddingHorizontal: spacing.md, paddingVertical: 8,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  expectedLabel: { fontSize: 11, color: colors.muted, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  expectedRef: { fontSize: 15, fontWeight: '900', color: colors.primary },
  qrActions: { flexDirection: 'row', gap: 8, width: '100%' },
  qrGhost: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, borderRadius: 14, backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border },
  qrGhostText: { color: colors.text, fontWeight: '800', fontSize: 12 },
  qrPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, borderRadius: 14, backgroundColor: colors.primary },
  qrPrimaryText: { color: colors.white, fontWeight: '800', fontSize: 12 },
  closeBtn: { position: 'absolute', top: 16, right: 16, width: 34, height: 34, borderRadius: 17, backgroundColor: colors.inputBg, alignItems: 'center', justifyContent: 'center' },
  chatOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  chatCard: { width: '100%', maxWidth: 480, height: 480, backgroundColor: colors.card, borderRadius: 24, overflow: 'hidden' },
  chatHead: { backgroundColor: '#1F2A3A', padding: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chatDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green },
  chatName: { color: colors.white, fontWeight: '800', fontSize: 14 },
  chatBody: { flex: 1, backgroundColor: colors.bg },
  bubbleRow: { flexDirection: 'row', marginBottom: spacing.sm },
  bubble: { maxWidth: '78%', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border, shadowColor: '#0B2545', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  bubbleText: { fontSize: 13, lineHeight: 19 },
  chatInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: spacing.md, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  chatInput: { flex: 1, backgroundColor: colors.inputBg, borderRadius: 12, paddingHorizontal: 14, height: 44, fontSize: 13, color: colors.text },
  chatSend: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});

const cc = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md, ...shadow.card },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: spacing.md },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '800' },
  ref: { fontSize: 11, color: colors.muted },
  roleLabel: { fontSize: 10, color: colors.muted, textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.5 },
  roleName: { fontSize: 14, fontWeight: '800', color: colors.text, marginTop: 2 },
  counterAvatar: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.primaryLight },
  counterAvatarFallback: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.primary },
  counterInitials: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  midBox: { paddingVertical: spacing.lg, gap: spacing.md },
  parcelLeft: { flexDirection: 'row', alignItems: 'center' },
  parcelIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  parcelName: { fontSize: 15, fontWeight: '800', color: colors.text },
  parcelWeight: { fontSize: 12, color: colors.muted, marginTop: 4 },
  parcelPrice: { fontSize: 12, color: colors.muted, marginTop: 3, fontWeight: '700' },
  parcelTotal: { color: colors.primary, fontWeight: '900' },
  routePill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.bg, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  routeEnd: { flex: 1 },
  routeLabel: { fontSize: 9, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  routeCity: { fontSize: 14, fontWeight: '800', color: colors.text, marginTop: 3 },
  routeMid: { flexDirection: 'column', alignItems: 'center', paddingHorizontal: 8 },
  routeLine: { width: 2, height: 18, backgroundColor: colors.green, marginVertical: 3, opacity: 0.5 },
  routeState: { fontSize: 9, fontWeight: '800', color: colors.green },
  pinZone: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', borderRadius: 16, padding: spacing.md },
  pinIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  pinTitle: { fontSize: 13, fontWeight: '800', color: '#065F46' },
  pinDesc: { fontSize: 11, color: '#047857', marginTop: 3, lineHeight: 16 },
  pinBox: { backgroundColor: colors.card, borderWidth: 1, borderColor: '#A7F3D0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
  pinLabel: { fontSize: 8, color: colors.muted, textTransform: 'uppercase', fontWeight: '800', letterSpacing: 0.8 },
  pinValue: { fontSize: 24, fontWeight: '900', color: colors.text, fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }), letterSpacing: 4 },
  actions: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, marginTop: spacing.md },
  actGhost: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 46, borderRadius: 14, backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border },
  actGhostText: { fontSize: 12, fontWeight: '800' },
  actBrand: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 46, borderRadius: 14, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#DBEAFE' },
  actBrandText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  actPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 46, borderRadius: 14, backgroundColor: colors.primary },
  actPrimaryText: { fontSize: 12, fontWeight: '800', color: colors.white },
  doneChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 46, borderRadius: 14, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0' },
  doneChipText: { fontSize: 12, fontWeight: '800', color: '#047857' },
});
