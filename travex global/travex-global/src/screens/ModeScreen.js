import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, surface } from '../theme/theme';
import { EmptyState } from '../components/common';
import TripCard from '../components/TripCard';
import useLive from '../utils/useLive';
import { listOpenTrips } from '../services/store';
import { MODE_META } from '../utils/modes';
import { MODE_HEADERS } from '../media/images';
import { kg } from '../utils/format';


export default function ModeScreen({ mode, navigation }) {
  const meta = MODE_META[mode];
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setTrips(await listOpenTrips({ from, to, transport: mode }));
    } finally {
      setLoading(false);
    }
  }, [from, to, mode]);

  useLive(load);

  const kgLeft = trips.reduce((s, t) => s + t.remainingKg, 0);

  // Image d'en-tête : hauteur réduite, l'image remplit le cadre.

  const header = (
    <View>
      <View style={styles.header}>
        <View style={styles.headerImage}>
          <Image source={MODE_HEADERS[mode]} style={StyleSheet.absoluteFill} resizeMode="cover" />
        </View>
        {/* Titre posé directement sur l'image, sans fond coloré */}
        <View style={styles.titleOverlay}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{meta.title}</Text>
            <Text style={styles.headerSub}>{trips.length} départ{trips.length > 1 ? 's' : ''} · {kg(kgLeft)} kg disponibles</Text>
          </View>
          <Ionicons name={meta.icon} size={28} color={colors.white} style={styles.titleIcon} />
        </View>
      </View>

      <View style={styles.searchBox}>
        <View style={styles.searchField}>
          <Ionicons name="location-outline" size={18} color={colors.muted} />
          <TextInput
            placeholder="Ville de départ"
            placeholderTextColor="#9AA3AF"
            value={from}
            onChangeText={setFrom}
            autoCapitalize="words"
            style={styles.searchInput}
          />
        </View>
        <View style={styles.searchField}>
          <Ionicons name="flag-outline" size={18} color={colors.muted} />
          <TextInput
            placeholder="Ville d’arrivée"
            placeholderTextColor="#9AA3AF"
            value={to}
            onChangeText={setTo}
            autoCapitalize="words"
            style={styles.searchInput}
          />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={trips}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <TripCard trip={item} onPress={() => navigation.navigate('TripDetail', { tripId: item.id })} />
        )}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState icon={meta.icon} title={`Aucun ${meta.title.toLowerCase()} pour le moment`} subtitle="Essayez une autre recherche ou revenez plus tard." />
          )
        }
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={meta.color} />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: surface.bg },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 40 },
  header: { marginTop: 0, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: surface.card },
  headerImage: { width: '100%', height: 140, backgroundColor: surface.primaryDark },
  titleOverlay: {
    position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
  },
  titleIcon: { marginLeft: spacing.md, textShadowColor: 'rgba(0, 0, 0, 0.6)', textShadowRadius: 6 },
  headerTitle: {
    color: colors.white, fontSize: 20, fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
  },
  headerSub: {
    color: colors.white, fontSize: 13, marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
  },
  searchBox: { marginTop: spacing.lg, marginBottom: spacing.md, gap: spacing.sm },
  searchField: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: surface.card,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.text, outlineStyle: 'none' },
});
