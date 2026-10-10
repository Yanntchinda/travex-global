import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radius, surface } from '../theme/theme';

// Carrousel défilant automatiquement (accueil uniquement).
// Chaque image REMPLIT entièrement le cadre du slider (resizeMode="cover").
// slides : [{ image, title, subtitle }] ; greeting : texte affiché sur l'image (haut à gauche).
export default function ImageSlider({ slides, onPressSlide, greeting, interval = 4500, height = 292 }) {
  const [w, setW] = useState(0);
  const [active, setActive] = useState(0);
  const ref = useRef(null);
  const index = useRef(0);

  useEffect(() => {
    if (!w || slides.length < 2) return undefined;
    const timer = setInterval(() => {
      index.current = (index.current + 1) % slides.length;
      ref.current?.scrollTo({ x: index.current * w, animated: true });
      setActive(index.current);
    }, interval);
    return () => clearInterval(timer);
  }, [w, slides.length, interval]);

  const onEnd = (e) => {
    if (!w) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / w);
    index.current = i;
    setActive(i);
  };

  const current = slides[active] || slides[0];

  return (
    <View style={[styles.wrap, { height }]} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onEnd}
        scrollEventThrottle={16}
        style={StyleSheet.absoluteFill}
      >
        {slides.map((s, i) => (
          <TouchableOpacity
            key={i}
            activeOpacity={0.95}
            onPress={() => onPressSlide && onPressSlide(s, i)}
            style={{ width: w || 1, height }}
          >
            <Image source={s.image} style={StyleSheet.absoluteFill} resizeMode="cover" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {!!greeting && (
        <View style={[styles.greetingWrap, styles.noTouch]}>
          <Text style={styles.greeting}>{greeting}</Text>
        </View>
      )}

      {/* Légende et points posés sur l'image, en bas */}
      <View style={[styles.captionWrap, styles.noTouch]}>
        <Text style={styles.title} numberOfLines={1}>{current.title}</Text>
        {slides.length > 1 && (
          <View style={styles.dots}>
            {slides.map((_, i) => (
              <View key={i} style={[styles.dot, i === active && styles.dotActive]} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: surface.primaryDark },
  noTouch: { pointerEvents: 'none' },
  greetingWrap: { position: 'absolute', top: 10, left: 10, right: 10 },
  greeting: {
    alignSelf: 'flex-start', color: colors.white, fontSize: 16, fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
  },
  captionWrap: {
    position: 'absolute', left: 10, right: 10, bottom: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  title: {
    color: colors.white, fontSize: 15, fontWeight: '800', flexShrink: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
  },
  dots: { flexDirection: 'row', gap: 5, marginLeft: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.45)' },
  dotActive: { width: 16, backgroundColor: surface.white },
});
