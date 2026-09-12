import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { EmptyState } from '../../components/common';
import { getConversations, sendChatMessage } from '../../services/supabase';
import { isOnline, subscribePresence } from '../../services/presence';

// ---------------------------------------------------------------------------
// Écran d'appel via Internet (VoIP).
// NOTE DÉMO : la sonnerie / la durée sont simulées localement. De vrais appels
// voix nécessitent WebRTC + un serveur de signalisation (Ex : Elixir, Agora,
// Twilio). Cet écran est prêt à recevoir un vrai flux audio quand le backend
// existera : brancher getUserMedia/WebRTC dans startCall()/endCall().
// ---------------------------------------------------------------------------
function CallModal({ visible, onClose, name, initials, calleeId, onMissed }) {
  const { t } = useLanguage();
  const [phase, setPhase] = useState('ringing'); // ringing | active
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const phaseRef = useRef('ringing');
  phaseRef.current = phase;

  // Sonnerie : le correspondant décroche après 4-8 s S'IL est en ligne ;
  // après 30 s sans réponse → appel manqué (message dans la conversation).
  useEffect(() => {
    if (!visible) { setPhase('ringing'); setSeconds(0); setMuted(false); setSpeaker(true); return; }
    const online = isOnline(calleeId);
    let answer;
    if (online) answer = setTimeout(() => setPhase('active'), 4000 + Math.floor(Math.random() * 4000));
    const noAnswer = setTimeout(() => {
      if (phaseRef.current === 'ringing') {
        if (onMissed) onMissed();
        onClose();
      }
    }, 30000);
    return () => { if (answer) clearTimeout(answer); clearTimeout(noAnswer); };
  }, [visible]);

  useEffect(() => {
    if (!visible || phase !== 'active') return;
    const chrono = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(chrono);
  }, [visible, phase]);

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const status = phase === 'ringing' ? t('msg.ringing') : `${t('msg.inCall')} · ${mmss}`;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.callOverlay}>
        <View style={styles.callAvatar}><Text style={styles.callAvatarText}>{initials || '?'}</Text></View>
        <Text style={styles.callName}>{name}</Text>
        <Text style={styles.callStatus}>{status}</Text>
        <Text style={styles.callVia}>{t('msg.calling')}</Text>

        <View style={styles.callControls}>
          <TouchableOpacity style={[styles.callBtn, muted && styles.callBtnOn]} activeOpacity={0.8} onPress={() => setMuted((m) => !m)}>
            <Ionicons name={muted ? 'mic-off' : 'mic'} size={22} color={muted ? colors.white : '#CBD5E1'} />
            <Text style={[styles.callBtnLabel, muted && { color: colors.white }]}>{t('msg.mute')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.callBtn, speaker && styles.callBtnOn]} activeOpacity={0.8} onPress={() => setSpeaker((s) => !s)}>
            <Ionicons name="volume-high" size={22} color={speaker ? colors.white : '#CBD5E1'} />
            <Text style={[styles.callBtnLabel, speaker && { color: colors.white }]}>{t('msg.speaker')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.callEnd} activeOpacity={0.85} onPress={onClose}>
          <Ionicons name="call" size={26} color={colors.white} style={{ transform: [{ rotate: '135deg' }] }} />
          <Text style={styles.callEndLabel}>{t('msg.endCall')}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function Conversation({ convo, onBack }) {
  const { t } = useLanguage();
  const [callOpen, setCallOpen] = useState(false);
  // Présence temps réel : « En ligne » / « Hors ligne » sous le nom.
  const [online, setOnline] = useState(isOnline(convo.id));

  // Appel manqué (30 s sans réponse) : message système en bas de la conversation.
  const onMissedCall = useCallback(async () => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setMessages((ms) => [...ms, { id: 'm_' + Date.now(), from: 'system', kind: 'missed', text: t('msg.missedCall'), time }]);
    try { await sendChatMessage({ convoId: convo.id, from: 'system', kind: 'missed', text: t('msg.missedCall'), name: convo.name }); } catch (e) {}
  }, [convo.id, convo.name, t]);
  useEffect(() => {
    setOnline(isOnline(convo.id));
    return subscribePresence(({ id, online: on }) => { if (id === convo.id) setOnline(on); });
  }, [convo.id]);
  const [messages, setMessages] = useState(convo.messages || []);
  const [draft, setDraft] = useState('');
  const [seen, setSeen] = useState(false); // accusé de lecture : "vu" par l'autre
  const listRef = useRef(null);
  const inputRef = useRef(null);

  // Simulation : une fois la conversation ouverte, l'autre a lu vos messages.
  useEffect(() => {
    const timer = setTimeout(() => setSeen(true), 900);
    return () => clearTimeout(timer);
  }, []);

  // À l'ouverture d'une conversation : le curseur se place automatiquement sur
  // la zone de saisie et le clavier sort pour permettre de rédiger directement.
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, []);

  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const msg = { id: 'me' + Date.now(), from: 'me', text, time, seen: true };
    setMessages((prev) => [...prev, msg]);
    setDraft('');
    // Notifie + persiste (temps réel).
    await sendChatMessage({ convoId: convo.id, from: 'me', text, name: convo.name });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={onBack} style={styles.chatBack}>
          <Ionicons name="arrow-back" size={22} color={colors.primaryDark} />
        </TouchableOpacity>
        <View style={styles.chatAvatar}><Text style={styles.chatAvatarText}>{convo.initials || '?'}</Text></View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={styles.chatName}>{convo.name}</Text>
          <Text style={[styles.chatStatus, !online && styles.chatStatusOff]}>
            <View style={[styles.onlineDot, !online && styles.onlineDotOff]} /> {online ? t('msg.online') : t('msg.offline')}
          </Text>
        </View>
        <TouchableOpacity style={styles.callBtnIcon} activeOpacity={0.7} onPress={() => setCallOpen(true)}>
          <Ionicons name="call-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.chatBody}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            // Message système (ex : appel manqué) — petite ligne centrée.
            if (item.from === 'system') {
              return (
                <View style={styles.callEvent}>
                  <Ionicons name="call" size={12} color="#F87171" style={{ transform: [{ rotate: '135deg' }] }} />
                  <Text style={styles.callEventText}>{item.text}</Text>
                  <Text style={styles.callEventTime}>{item.time}</Text>
                </View>
              );
            }
            const mine = item.from === 'me';
            return (
              <View style={[styles.bubble, mine ? styles.bubbleMe : styles.bubbleThem]}>
                <Text style={[styles.bubbleText, mine && { color: '#fff' }]}>{item.text}</Text>
                <View style={styles.bubbleMeta}>
                  <Text style={[styles.bubbleTime, mine && { color: 'rgba(255,255,255,0.8)' }]}>{item.time}</Text>
                  {mine && (
                    <Ionicons
                      name={(item.seen ?? seen) ? 'checkmark-done' : 'checkmark'}
                      size={14}
                      color={(item.seen ?? seen) ? '#BDE3FF' : 'rgba(255,255,255,0.8)'}
                    />
                  )}
                </View>
              </View>
            );
          }}
        />
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={t('msg.placeholder')}
            placeholderTextColor="#9AA3AF"
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={send}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <CallModal
        visible={callOpen}
        onClose={() => setCallOpen(false)}
        name={convo.name}
        initials={convo.initials}
        calleeId={convo.id}
        onMissed={onMissedCall}
      />
    </SafeAreaView>
  );
}

export default function MessagesScreen({ navigation, route }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [openChat, setOpenChat] = useState(null);
  const [conversations, setConversations] = useState([]);

  const load = useCallback(async () => {
    const list = await getConversations();
    setConversations(list || []);
  }, []);

  // Recharge les conversations à chaque retour sur l'onglet (réservations/propositions/…).
  useEffect(() => {
    if (!user) return;
    load();
    const unsub = navigation.addListener('focus', () => load());
    return unsub;
  }, [load, user, navigation]);

  const openConversation = useCallback(async (id) => {
    const list = await getConversations();
    setConversations(list || []);
    const convo = (list || []).find((c) => c.id === id);
    if (convo) {
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
      setOpenChat(convo);
    } else {
      setOpenChat({ id, name: 'Correspondant', initials: 'C', messages: [] });
    }
  }, []);

  // Ouvre directement la conversation demandée par la navigation (bouton "Contacter").
  const openConvoId = route?.params?.openConvoId;
  useEffect(() => {
    if (openConvoId && user) {
      openConversation(openConvoId);
      navigation.setParams?.({ openConvoId: undefined });
    }
  }, [openConvoId, user, openConversation, navigation]);

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Text style={styles.title}>{t('msg.title')}</Text>
        <EmptyState
          icon="chatbubble-ellipses-outline"
          title={t('msg.empty')}
          subtitle={t('msg.emptyDesc')}
        />
      </SafeAreaView>
    );
  }

  if (openChat) {
    return <Conversation convo={openChat} onBack={() => { setOpenChat(null); load(); }} />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{t('msg.title')}</Text>
        <Ionicons name="create-outline" size={22} color={colors.primary} />
      </View>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {conversations.length === 0 && (
          <EmptyState icon="chatbubble-ellipses-outline" title={t('msg.empty')} subtitle={t('msg.emptyDesc')} />
        )}
        {conversations.map((c) => (
          <TouchableOpacity key={c.id} style={styles.convo} onPress={() => openConversation(c.id)} activeOpacity={0.85}>
            <View>
              <View style={styles.convoAvatar}>
                <Text style={styles.convoAvatarText}>{c.initials || 'C'}</Text>
              </View>
              <View style={[styles.presenceDot, isOnline(c.id) && styles.presenceDotOn]} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.convoName}>{c.name}</Text>
              <Text style={styles.convoLast} numberOfLines={1}>{c.last}</Text>
              <Text style={[styles.convoPresence, isOnline(c.id) && styles.convoPresenceOn]}>
                {isOnline(c.id) ? t('msg.online') : t('msg.offline')}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.convoTime}>{c.time}</Text>
              {c.unread > 0 && <View style={styles.unread}><Text style={styles.unreadText}>{c.unread}</Text></View>}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ---- Écran d'appel ----
  callOverlay: {
    flex: 1, backgroundColor: '#04102B', alignItems: 'center', justifyContent: 'center', padding: spacing.xl,
  },
  callAvatar: {
    width: 110, height: 110, borderRadius: 55, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg,
  },
  callAvatarText: { color: colors.white, fontSize: 38, fontWeight: '900' },
  callName: { color: colors.white, fontSize: 24, fontWeight: '800' },
  callStatus: { color: '#8FB3FF', fontSize: 14, fontWeight: '600', marginTop: 6 },
  callVia: { color: '#64748B', fontSize: 12, marginTop: 4 },
  callControls: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xxl * 2 },
  callBtn: {
    width: 74, height: 74, borderRadius: 37, backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  callBtnOn: { backgroundColor: colors.primary },
  callBtnLabel: { color: '#CBD5E1', fontSize: 10, fontWeight: '700' },
  callEnd: {
    marginTop: spacing.xxl, width: 74, height: 74, borderRadius: 37, backgroundColor: '#E02424',
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  callEndLabel: { color: colors.white, fontSize: 10, fontWeight: '700' },
  callBtnIcon: { padding: 6 },
  safe: { flex: 1, backgroundColor: colors.bg },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: '5%', paddingVertical: spacing.md },
  title: { fontSize: 22, fontWeight: '800', color: colors.primaryDark, paddingHorizontal: '5%', paddingVertical: spacing.md },
  list: { paddingHorizontal: '5%', paddingTop: 0, paddingBottom: spacing.lg },
  convo: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.sm, ...shadow.card,
  },
  convoAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  convoAvatarText: { color: colors.primary, fontWeight: '800', fontSize: 17 },
  convoName: { fontSize: 16, fontWeight: '700', color: colors.text },
  convoLast: { fontSize: 13, color: colors.muted, marginTop: 3 },
  convoTime: { fontSize: 12, color: colors.muted },
  unread: { marginTop: 6, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: '5%', paddingVertical: spacing.md },
  chatBack: { padding: 4, marginRight: spacing.sm },
  chatAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  chatAvatarText: { color: colors.primary, fontWeight: '800' },
  chatName: { fontSize: 16, fontWeight: '700', color: colors.text },
  chatStatus: { fontSize: 12, color: colors.green, flexDirection: 'row', alignItems: 'center' },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green, marginRight: 4 },
  onlineDotOff: { backgroundColor: '#94A3B8' },
  chatStatusOff: { color: colors.muted },
  presenceDot: {
    position: 'absolute', right: -1, bottom: -1, width: 13, height: 13, borderRadius: 7,
    backgroundColor: '#94A3B8', borderWidth: 2.5, borderColor: colors.white,
  },
  presenceDotOn: { backgroundColor: '#22C55E' },
  convoPresence: { fontSize: 11, color: colors.muted, fontWeight: '600', marginTop: 2 },
  convoPresenceOn: { color: '#16A34A' },
  chatList: { paddingHorizontal: '5%', paddingVertical: spacing.lg },
  // Le corps du chat se termine AU-DESSUS de la barre d'onglets flottante :
  // la zone de saisie reste ainsi toujours visible et accessible.
  chatBody: { flex: 1, paddingBottom: 104 },
  callEvent: {
    alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(248,113,113,0.12)', borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 6, marginBottom: spacing.sm,
  },
  callEventText: { fontSize: 12, fontWeight: '700', color: '#F87171' },
  callEventTime: { fontSize: 11, color: colors.muted },
  bubble: { maxWidth: '78%', borderRadius: 18, padding: spacing.md, marginBottom: spacing.sm },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleThem: { alignSelf: 'flex-start', backgroundColor: colors.card, borderBottomLeftRadius: 4, ...shadow.card },
  bubbleText: { fontSize: 15, color: colors.text, lineHeight: 21 },
  bubbleTime: { fontSize: 11, color: colors.muted, marginRight: 4 },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, backgroundColor: colors.inputBg, borderRadius: 22, paddingHorizontal: spacing.lg, height: 46, fontSize: 15, color: colors.text },
  sendBtn: { marginLeft: spacing.sm, width: 46, height: 46, borderRadius: 23, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
});
