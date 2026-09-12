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
const TOP_OFFSET = 50;

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
        {/* Notification : pastille sombre discrète derrière le message
            (lisible sur tout écran). Pas de rond d'ouverture, pas d'icône :
            le message sort, reste ~4,5 s puis se referme tout seul. */}
        {mounted && (
          <Animated.View
            style={[
              styles.messageWrap,
              {
                opacity: contentAnim,
                transform: [
                  { translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
                  { scale: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
                ],
              },
            ]}
          >
            <Text style={styles.message} numberOfLines={2}>{body || title}</Text>
          </Animated.View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute', top: TOP_OFFSET, left: 0, right: 0,
    alignItems: 'center', zIndex: 9999, elevation: 30,
  },
  // Message avec fond sombre arrondi (contraste garanti), sans rond ni icône.
  messageWrap: {
    maxWidth: 340, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center',
    backgroundColor: 'rgba(2,6,23,0.92)', borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35,
    shadowRadius: 18, elevation: 12,
  },
  message: {
    color: '#FFFFFF', fontSize: 13, fontWeight: '800', textAlign: 'center', lineHeight: 18,
  },
});
