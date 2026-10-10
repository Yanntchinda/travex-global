import React, { useRef, useState, useEffect } from 'react';
import { View, PanResponder, StyleSheet } from 'react-native';
import { colors } from '../theme/theme';

// Slider horizontal simple (sans dépendance externe), utilisable sur web et mobile.
// S'appuie sur la position absolue de l'écran pour un glissement fiable.
export default function Slider({ min = 1, max = 50, value, onChange, fillColor = colors.primary, thumbColor = colors.primary }) {
  const total = Math.max(1, max - min);
  const [local, setLocal] = useState(value ?? min);
  const current = value ?? local;
  const trackRef = useRef(null);
  const originX = useRef(0);
  const widthRef = useRef(1);

  const clamp = (v) => Math.max(min, Math.min(max, Math.round(v)));

  const setByX = (absX) => {
    const ratio = Math.max(0, Math.min(1, (absX - originX.current) / widthRef.current));
    const next = clamp(min + ratio * total);
    setLocal(next);
    if (onChange) onChange(next);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e, g) => setByX(g.x0),
      onPanResponderMove: (e, g) => setByX(g.moveX),
    })
  ).current;

  const captureOrigin = () => {
    trackRef.current?.measure((x, y, width, height, pageX) => {
      originX.current = pageX;
      widthRef.current = width || 1;
    });
  };
  useEffect(() => { captureOrigin(); }, []);
  useEffect(() => {
    // Re-mesure quand la taille change (rotation, etc.)
    const t = setTimeout(captureOrigin, 120);
    return () => clearTimeout(t);
  }, [max, min]);
  useEffect(() => { setLocal(value ?? min); }, [value]);

  const ratio = (current - min) / total;
  const pct = `${ratio * 100}%`;

  return (
    <View style={s.row}>
      <View
        ref={trackRef}
        style={s.track}
        onLayout={() => setTimeout(captureOrigin, 0)}
        {...pan.panHandlers}
      >
        <View style={[s.fill, { backgroundColor: fillColor, width: pct }]} />
        <View style={[s.thumb, { backgroundColor: thumbColor, left: pct }]} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: { height: 36, justifyContent: 'center' },
  track: {
    height: 8, borderRadius: 4, backgroundColor: '#E3E8EE',
    justifyContent: 'center', position: 'relative', width: '100%',
  },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 4 },
  thumb: {
    position: 'absolute', width: 22, height: 22, borderRadius: 11,
    marginLeft: -11, top: -7, shadowColor: '#0B2545',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3, elevation: 3,
  },
});
