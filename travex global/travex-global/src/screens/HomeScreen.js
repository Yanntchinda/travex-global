import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow, surface } from '../theme/theme';
import { EmptyState } from '../components/common';
import TripCard from '../components/TripCard';
import ImageSlider from '../components/ImageSlider';
import useLive from '../utils/useLive';
import { listOpenTrips, getSessionInfo } from '../services/store';
import { APP } from '../config';
import { IMAGES } from '../media/images';
import { kg } from '../utils/format';

const SLIDES = [
  { image: IMAGES.bannerAerien, title: 'Fret aérien', subtitle: 'Vos colis dans les soutes des avions', target: 'Avions' },
  { image: IMAGES.bannerBagage, title: 'Voyagez avec vos colis', subtitle: 'Réservez la place de votre bagage', target: 'Avions' },
  { image: IMAGES.bannerCargo, title: 'Fret maritime', subtitle: 'Cargo pour vos envois volumineux', target: 'Cargo' },
  { image: IMAGES.bannerRoRo, title: 'Ferries RO-RO', subtitle: 'Véhicules et remorques par bateau', target: 'RO-RO' },
];


export default function HomeScreen({ navigation }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState(null);

  const load = useCallback(async () => {
    try {
      const [t, info] = await Promise.all([listOpenTrips(), getSessionInfo()]);
      setTrips(t);
      setFirstName(info.role === 'user' ? info.user.firstName : null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Se met à jour seul : à chaque changement de données et toutes les 5 s.
  useLive(load);

  const totalKg = trips.reduce((s, t) => s + t.remainingKg, 0);
  const greeting = firstName ? `Bienvenue, ${firstName}` : 'Bienvenue sur TRAVEX GLOBAL';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
      >
        <View>
          <ImageSlider
            slides={SLIDES}
            greeting={greeting}
            onPressSlide={(s) => navigation.navigate(s.target)}
          />
        </View>

        <View style={styles.liveBar}>
          <Text style={styles.liveText}>
            <Text style={styles.liveStrong}>{trips.length}</Text> départ{trips.length > 1 ? 's' : ''} disponible{trips.length > 1 ? 's' : ''}
            {'  ·  '}
            <Text style={styles.liveStrong}>{kg(totalKg)} kg</Text> à réserver
          </Text>
          <View style={styles.liveDot} />
        </View>

        <Text style={styles.sectionTitle}>Prochains départs</Text>
        {trips.length === 0 && !loading ? (
          <EmptyState icon="calendar-outline" title="Aucun départ publié" subtitle="Les nouveaux départs apparaîtront ici." />
        ) : (
          trips.slice(0, 6).map((tr) => (
            <TripCard key={tr.id} trip={tr} onPress={() => navigation.navigate('TripDetail', { tripId: tr.id })} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: surface.bg },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 40, paddingTop: spacing.md },
  brand: { color: colors.primaryDark, fontWeight: '900', letterSpacing: 1.5, fontSize: 14 },
  liveBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md,
    backgroundColor: surface.card, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  liveText: { color: colors.text, fontSize: 14 },
  liveStrong: { fontWeight: '900', color: colors.primary },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.primaryDark, marginTop: spacing.xl, marginBottom: spacing.md },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  tile: {
    flex: 1, backgroundColor: surface.card, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  tileIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontSize: 14, fontWeight: '800', color: colors.primaryDark, marginTop: spacing.sm },
  tileCount: { fontSize: 26, fontWeight: '900', color: colors.text, marginTop: 2 },
  tileSub: { fontSize: 11, color: colors.muted, marginTop: 2 },
});
