import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  FlatList, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { TripCard } from '../../components/trip';
import { Loading, EmptyState } from '../../components/common';
import { fetchTrips } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { CITIES } from '../../data/mockData';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [tab, setTab] = useState('voyages'); // 'voyages' | 'demande'
  const [query, setQuery] = useState('');
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchTrips();
      setTrips(data);
    } catch (e) {
      setTrips([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const filtered = query
    ? trips.filter((t) =>
        [t.from, t.to, CITIES[t.from]?.name, CITIES[t.to]?.name]
          .filter(Boolean)
          .some((x) => x.toLowerCase().includes(query.toLowerCase()))
      )
    : trips;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Bienvenue chez TRAVEX</Text>
        <Text style={styles.subGreeting}>{user ? `Bonjour ${user.firstName}` : ''}</Text>
      </View>

      {/* Onglets Voyages / Demande */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'voyages' && styles.tabActive]}
          onPress={() => setTab('voyages')}
        >
          <Text style={[styles.tabText, tab === 'voyages' && styles.tabTextActive]}>Voyages</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'demande' && styles.tabActive]}
          onPress={() => setTab('demande')}
        >
          <Text style={[styles.tabText, tab === 'demande' && styles.tabTextActive]}>Demande</Text>
        </TouchableOpacity>
      </View>

      {/* Recherche */}
      <View style={styles.search}>
        <Ionicons name="search" size={20} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher une destination..."
          placeholderTextColor="#9AA3AF"
          value={query}
          onChangeText={setQuery}
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <Loading />
      ) : tab === 'voyages' ? (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TripCard
              trip={item}
              onPress={() => navigation.navigate('TripDetail', { id: item.id })}
              onShare={() => {}}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={
            <EmptyState icon="airplane-outline" title="Aucun voyage trouvé" subtitle="Aucun voyage ne correspond à votre recherche." />
          }
        />
      ) : (
        <View style={{ flex: 1 }}>
          <EmptyState
            icon="trending-up-outline"
            title="Aucune demande pour le moment"
            subtitle="Publiez une demande ou parcourez les annonces de départs disponibles."
          />
        </View>
      )}

      {/* Bouton flottant + */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('PublishTrip')}
        activeOpacity={0.9}
      >
        <Ionicons name="add" size={32} color={colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  greeting: { fontSize: 22, fontWeight: '800', color: colors.text },
  subGreeting: { fontSize: 14, color: colors.muted, marginTop: 2 },
  tabs: {
    flexDirection: 'row', marginHorizontal: spacing.lg, marginTop: spacing.md,
    backgroundColor: colors.card, borderRadius: 30, padding: 5, ...shadow.card,
  },
  tab: {
    flex: 1, height: 44, borderRadius: 26, alignItems: 'center', justifyContent: 'center',
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 15, fontWeight: '600', color: colors.muted },
  tabTextActive: { color: colors.white },
  search: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, marginHorizontal: spacing.lg, marginTop: spacing.md,
    borderRadius: radius.xl, paddingHorizontal: spacing.lg, height: 52, ...shadow.card,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: colors.text },
  list: { padding: spacing.lg, paddingBottom: 100 },
  fab: {
    position: 'absolute', right: 24, bottom: 28,
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0B2545', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10,
    elevation: 6,
  },
});
