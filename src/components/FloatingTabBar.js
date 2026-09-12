import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme/theme';
import { useLanguage } from '../context/LanguageContext';

const ICONS = {
  Accueil: 'home',
  Réservations: 'book',
  Annonces: 'list',
  Messages: 'chatbubble-ellipses',
  Profil: 'person',
};

const LABEL_KEY = {
  Accueil: 'tab.home',
  Réservations: 'tab.bookings',
  Annonces: 'tab.listings',
  Messages: 'tab.messages',
  Profil: 'tab.profile',
};

// Barre de navigation "floating indicator" :
//  - un indicateur circulaire bleu qui GLISSE entre les onglets,
//  - l'icône de l'onglet actif apparaît DANS l'indicateur,
//  - chaque icône reste alignée verticalement au-dessus de son libellé.
export default function FloatingTabBar({ state, descriptors, navigation }) {
  const routes = state.routes;
  const { t } = useLanguage();
  const [activeIdx, setActiveIdx] = useState(state.index);
  const [frameWidth, setFrameWidth] = useState(0);
  const anim = useRef(new Animated.Value(state.index)).current;
  const fade = useRef(new Animated.Value(1)).current;

  // Réagit aux changements d'onglet venant d'ailleurs (ex : "Contacter" -> Messages).
  // Sans cela, l'indicateur restait figé sur l'onglet d'origine après une navigation programmée.
  useEffect(() => {
    setActiveIdx(state.index);
    Animated.timing(anim, {
      toValue: state.index,
      duration: 380,
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
      useNativeDriver: true,
    }).start();
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [state.index]);

  // Largeur réelle du conteneur mesurée au rendu : dans l'aperçu web
  // « format téléphone », Dimensions.get('window') renvoie la largeur du
  // navigateur (pas celle du cadre mobile), d'où la mesure via onLayout.
  const barWidth = frameWidth > 0
    ? frameWidth - spacing.lg * 2
    : Dimensions.get('window').width - spacing.lg * 2;
  const itemWidth = barWidth / routes.length;
  const indicatorSize = 72;

  const moveTo = (index) => {
    setActiveIdx(index);
    Animated.timing(anim, {
      toValue: index,
      duration: 380,
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
      useNativeDriver: true,
    }).start();
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  };

  // Décalage calculé pour centrer l'indicateur sur l'onglet cible.
  // Base : centre de l'onglet 0 - moitié de l'indicateur + padding.
  const baseOffset = itemWidth / 2 - indicatorSize / 2;
  const translateX = anim.interpolate({
    inputRange: [0, routes.length - 1],
    outputRange: [0, itemWidth * (routes.length - 1)],
  });

  return (
    <View
      style={styles.wrap}
      onLayout={(e) => setFrameWidth(e.nativeEvent.layout.width)}
    >
      <View style={styles.container}>
        {/* Indicateur flottant (cercle dégradé) */}
        <Animated.View
          style={[
            styles.indicator,
            {
              width: indicatorSize,
              height: indicatorSize,
              borderRadius: indicatorSize / 2,
              transform: [{ translateX: Animated.add(translateX, new Animated.Value(baseOffset)) }],
            },
          ]}
          pointerEvents="none"
        >
          <View style={styles.indicatorFill}>
            <Animated.View style={{ opacity: fade }}>
              <Ionicons name={ICONS[routes[activeIdx]?.name] || 'ellipse'} size={26} color="#fff" />
            </Animated.View>
          </View>
        </Animated.View>

        {/* Fond de la barre */}
        <View style={styles.bar} />

        {/* Onglets */}
        <View style={styles.items}>
          {routes.map((route, index) => {
            const focused = state.index === index;
            const baseIcon = ICONS[route.name] || 'ellipse';
            const opacity = focused ? 0 : 1;
            const labelWeight = focused ? '800' : '600';
            const labelColor = focused ? colors.text : colors.muted;

            const onPress = () => {
              moveTo(index);
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            };

            return (
              <TouchableOpacity key={route.key} style={styles.item} onPress={onPress} activeOpacity={0.8}>
                <View style={{ height: 30, opacity, justifyContent: 'center' }}>
                  <Ionicons name={`${baseIcon}-outline`} size={20} color={colors.muted} />
                </View>
                <Text style={[styles.label, { fontWeight: labelWeight, color: labelColor }]}>
                  {t(LABEL_KEY[route.name] || route.name)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: '5%', paddingBottom: spacing.md,
  },
  container: { position: 'relative', height: 92, justifyContent: 'flex-end' },
  bar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    height: 68, backgroundColor: colors.card, borderRadius: 22,
    shadowColor: '#0B2545', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14,
    shadowRadius: 18, elevation: 10,
  },
  items: { flexDirection: 'row', height: 68, zIndex: 10 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, marginTop: 4 },
  indicator: {
    position: 'absolute', top: 0, left: 0, zIndex: 20,
  },
  indicatorFill: {
    width: '100%', height: '100%', borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary,
  },
});
