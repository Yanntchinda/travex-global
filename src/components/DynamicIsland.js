import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { subscribeNotifications, getLatestUnread } from '../services/supabase';
import { useLanguage } from '../context/LanguageContext';

// ---------------------------------------------------------------------------
// Indicateur de notification « Dynamic Island ».
//  - Au repos : INVISIBLE (aucun point affiché, l'app reste intacte).
//  - À l'arrivée d'une notification : la capsule apparaît avec un rebond ressort,
//  - le contenu apparaît avec fondu + glissement + flou,
//  - rétraction automatique après 4,5 s, ou au toucher.
// ---------------------------------------------------------------------------
const COMPACT = { w: 22, h: 22, r: 11 }; // taille d'ouverture (rond), invisible au repos
const SCREEN_W = Dimensions.get('window').width;
const EXPANDED_W = Math.min(340, SCREEN_W - 40);
const EXPANDED = { w: EXPANDED_W, h: 68, r: 32 };
// Décalage vertical de la capsule : elle apparaît quelques centimètres sous le
// haut de l'écran (sous les en-têtes), sans recouvrir le titre des écrans.
const TOP_OFFSET = 110;

// Couleur de la pastille d'icône selon le type de notification.
const TINTS = {
  publish: { color: '#38BDF8', bg: 'rgba(56,189,248,0.20)' },
  status: { color: '#34D399', bg: 'rgba(52,211,153,0.20)' },
  message: { color: '#818CF8', bg: 'rgba(129,140,248,0.20)' },
  booking: { color: '#38BDF8', bg: 'rgba(56,189,248,0.20)' },
  proposal: { color: '#818CF8', bg: 'rgba(129,140,248,0.20)' },
  shipment: { color: '#FBBF24', bg: 'rgba(251,191,36,0.20)' },
  landing: { color: '#34D399', bg: 'rgba(52,211,153,0.20)' },
  info: { color: '#38BDF8', bg: 'rgba(56,189,248,0.20)' },
};

export default function DynamicIsland({ onPress }) {
  const { lang } = useLanguage();
  const [notif, setNotif] = useState(null);
  const [mounted, setMounted] = useState(false);

  // 0 = compact, 1 = étendu
  const anim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const closeTimer = useRef(null);
  const expandedRef = useRef(false);

  const retract = useCallback(() => {
    if (!expandedRef.current) return;
    expandedRef.current = false;
    contentAnim.setValue(0);
    Animated.spring(anim, {
      toValue: 0,
      friction: 7,
      tension: 70,
      useNativeDriver: false,
    }).start(() => setMounted(false));
  }, [anim, contentAnim]);

  const expand = useCallback(() => {
    expandedRef.current = true;
    setMounted(true);
    Animated.spring(anim, {
      toValue: 1,
      friction: 7,
      tension: 60,
      useNativeDriver: false,
    }).start();
    // Le contenu arrive légèrement après le début de l'ouverture (comme la maquette).
    setTimeout(() => {
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }).start();
    }, 90);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(retract, 4500);
  }, [anim, contentAnim, retract]);

  // Présente une notification (venant du bus temps réel ou du dernier non-lu).
  const present = useCallback((n) => {
    if (!n) return;
    setNotif(n);
    if (expandedRef.current) {
      // Déjà ouverte : on remplace le contenu et on relance le minuteur.
      if (closeTimer.current) clearTimeout(closeTimer.current);
      closeTimer.current = setTimeout(retract, 4500);
    } else {
      expand();
    }
  }, [expand, retract]);

  // Abonnement aux nouvelles notifications (publication, statut, message, réservation…).
  useEffect(() => {
    const unsub = subscribeNotifications(present);
    // À l'ouverture de l'app : montre la dernière notification non lue.
    const timer = setTimeout(() => {
      getLatestUnread().then((n) => { if (n) present(n); });
    }, 900);
    return () => { unsub(); clearTimeout(timer); if (closeTimer.current) clearTimeout(closeTimer.current); };
  }, [present]);

  const width = anim.interpolate({ inputRange: [0, 1], outputRange: [COMPACT.w, EXPANDED.w] });
  const height = anim.interpolate({ inputRange: [0, 1], outputRange: [COMPACT.h, EXPANDED.h] });
  const radius = anim.interpolate({ inputRange: [0, 1], outputRange: [COMPACT.r, EXPANDED.r] });
  const tint = TINTS[notif?.type] || TINTS.info;
  const title = notif ? (notif['title_' + lang] || notif.title_fr) : '';
  const body = notif ? (notif['body_' + lang] || notif.body_fr) : '';

  const onIslandPress = () => {
    if (expandedRef.current) {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      retract();
    } else if (notif) {
      expand();
    }
    if (typeof onPress === 'function' && notif) onPress(notif);
  };

  return (
    <View style={styles.host} pointerEvents="box-none">
      <TouchableOpacity
        activeOpacity={1}
        onPress={onIslandPress}
        disabled={!notif}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={{ opacity: mounted ? 1 : 0 }}
        pointerEvents={mounted ? 'auto' : 'none'}
      >
        <Animated.View style={[styles.island, { width, height, borderRadius: radius }]}>
          {/* Au repos : un simple rond (pastille d'état) */}
          {!mounted && <View style={styles.compactDotInner} />}

          {/* Contenu étendu */}
          {mounted && (
            <Animated.View
              style={[
                styles.contentRow,
                {
                  opacity: contentAnim,
                  transform: [
                    { translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
                    { scale: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
                  ],
                },
              ]}
            >
              <View style={[styles.iconBubble, { backgroundColor: tint.bg }]}>
                <Ionicons name={notif?.icon || 'notifications'} size={18} color={tint.color} />
              </View>
              <View style={styles.textCol}>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                <Text style={styles.subtitle} numberOfLines={1}>{body}</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color="#475569" />
            </Animated.View>
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute', top: TOP_OFFSET, left: 0, right: 0,
    alignItems: 'center', zIndex: 9999, elevation: 30,
  },
  island: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(30,41,59,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
  },
  // Pastille d'état affichée dans le rond au repos.
  compactDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0EA5E9' },
  contentRow: {
    flexDirection: 'row', alignItems: 'center', width: '100%',
    paddingHorizontal: 12, gap: 12,
  },
  iconBubble: { width: 36, height: 36, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  textCol: { flex: 1, minWidth: 0 },
  title: { color: '#F1F5F9', fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  subtitle: { color: '#94A3B8', fontSize: 10, marginTop: 2 },
});
