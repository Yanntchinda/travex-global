import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, RefreshControl, Modal, ScrollView, Image, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { TripCard } from '../../components/trip';
import { DemandCard } from '../../components/demand';
import { Loading, EmptyState } from '../../components/common';
import { fetchTrips, getNotifications, getFavoriteIds, toggleFavorite } from '../../services/supabase';
import { shareListing } from '../../services/share';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { CITIES } from '../../data/mockData';

const HERO_SLIDES = [
  { image: require('../../../assets/hero/hero1.jpg') },
  { image: require('../../../assets/hero/hero2.jpg') },
  { image: require('../../../assets/hero/hero3.jpg') },
];

// Feuille de choix publié (départ / demande)
function PublishChoiceModal({ visible, onClose, onChoose }) {
  const { t } = useLanguage();
  const options = [
    { key: 'voyage', icon: 'airplane', title: t('publish.departure'), desc: t('publish.departureDesc'), color: colors.primary },
    { key: 'demande', icon: 'trending-up', title: t('publish.request'), desc: t('publish.requestDesc'), color: colors.accent },
  ];
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{t('publish.chooseTitle')}</Text>
          {options.map((o) => (
            <TouchableOpacity key={o.key} style={styles.option} activeOpacity={0.85} onPress={() => onChoose(o.key)}>
              <View style={[styles.optionIcon, { backgroundColor: o.color + '1A' }]}>
                <Ionicons name={o.icon} size={24} color={o.color} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.optionTitle}>{o.title}</Text>
                <Text style={styles.optionDesc}>{o.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [tab, setTab] = useState('voyages');
  const [query, setQuery] = useState('');
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [slide, setSlide] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const [favIds, setFavIds] = useState([]);
  const slideTimer = useRef(null);

  // Auto-défilement du slider d'images toutes les 4 s.
  useEffect(() => {
    slideTimer.current = setInterval(() => {
      setSlide((s) => (s + 1) % HERO_SLIDES.length);
    }, 4000);
    return () => clearInterval(slideTimer.current);
  }, []);

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

  // Favoris : chargés une fois, réaffichés en tête de liste à chaque ouverture.
  useEffect(() => { getFavoriteIds().then((ids) => setFavIds(ids || [])); }, []);
  const onToggleFavorite = useCallback(async (id) => {
    const next = await toggleFavorite(id);
    setFavIds(next || []);
  }, []);

  // Compteur de notifications non lues (badge sur la cloche).
  const loadNotifs = useCallback(async () => {
    try {
      const list = await getNotifications();
      setNotifCount((list || []).filter((n) => !n.read).length);
    } catch { setNotifCount(0); }
  }, []);

  // Recharge à chaque retour sur l'écran (publication / réservation / validation en temps réel).
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => { load(); loadNotifs(); });
    return unsub;
  }, [navigation, load, loadNotifs]);

  const onRefresh = () => { setRefreshing(true); load(); };

  // Les voyages favoris remontent en première position de l'accueil.
  const byFavorite = (a, b) => (favIds.includes(b.id) ? 1 : 0) - (favIds.includes(a.id) ? 1 : 0);
  const listData = tab === 'voyages'
    ? trips.filter((t) =>
        !t.isDemande &&
        (!query || [t.from, t.to, CITIES[t.from]?.name, CITIES[t.to]?.name].filter(Boolean)
          .some((x) => x.toLowerCase().includes(query.toLowerCase()))))
    : trips.filter((t) =>
        t.isDemande &&
        (!query || [t.from, t.to, CITIES[t.from]?.name, CITIES[t.to]?.name].filter(Boolean)
          .some((x) => x.toLowerCase().includes(query.toLowerCase()))));

  const onChoose = (type) => {
    setShowPublish(false);
    navigation.navigate('PublishTrip', { type });
  };

  const available = trips.filter((t) => !t.isDemande).length;
  const demandes = trips.filter((t) => t.isDemande).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Héro premium — slider d'images sombres avec texte superposé */}
        <View style={styles.hero}>
          <Image
            source={HERO_SLIDES[slide].image}
            style={styles.heroImage}
            resizeMode="cover"
          />
          {/* Voile sombre pour la lisibilité du texte */}
          <View style={styles.heroOverlay} />

          <View style={styles.heroContent}>
            <Text style={styles.brandSmall}>TRAVEX GLOBAL</Text>
            <Text style={styles.greeting}>
              {t('home.welcome')}{user?.firstName ? `, ${user.firstName}` : ''}
            </Text>
            <Text style={styles.subGreeting}>
              {user ? t('home.logged') : t('home.guest')}
            </Text>
          </View>

          {!user && (
            <TouchableOpacity style={styles.loginChip} onPress={() => navigation.navigate('SignIn')}>
              <Ionicons name="person-circle-outline" size={16} color={colors.white} />
              <Text style={styles.loginChipText}>{t('home.login')}</Text>
            </TouchableOpacity>
          )}

          {/* Cloche de notifications (pour les utilisateurs connectés) */}
          {user && (
            <TouchableOpacity style={styles.bell} onPress={() => navigation.navigate('Notifications')}>
              <Ionicons name="notifications-outline" size={22} color={colors.white} />
              {notifCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{notifCount > 99 ? '99+' : notifCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Indicateurs du slider */}
          <View style={styles.slideDots}>
            {HERO_SLIDES.map((_, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.slideDot, i === slide && styles.slideDotActive]}
                onPress={() => setSlide(i)}
              />
            ))}
          </View>
        </View>

        {/* Onglets Voyages / Demande */}
        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, tab === 'voyages' && styles.tabActive]} onPress={() => setTab('voyages')}>
            <Ionicons name="airplane-outline" size={16} color={tab === 'voyages' ? colors.white : colors.muted} />
            <Text style={[styles.tabText, tab === 'voyages' && styles.tabTextActive]}>{t('home.departures')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'demande' && styles.tabActive]} onPress={() => setTab('demande')}>
            <Ionicons name="trending-up-outline" size={16} color={tab === 'demande' ? colors.white : colors.muted} />
            <Text style={[styles.tabText, tab === 'demande' && styles.tabTextActive]}>{t('home.requests')}</Text>
          </TouchableOpacity>
        </View>

        {/* Recherche */}
        <View style={styles.search}>
          <Ionicons name="search" size={20} color={colors.muted} />
          <TextInput style={styles.searchInput} placeholder={t('home.search')} placeholderTextColor="#9AA3AF" value={query} onChangeText={setQuery} />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.muted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {loading ? (
          <Loading />
        ) : listData.length === 0 ? (
          <EmptyState
            icon={tab === 'voyages' ? 'airplane-outline' : 'trending-up-outline'}
            title={tab === 'voyages' ? t('home.noDepartures') : t('home.noRequests')}
            subtitle={t('home.noResult')}
          />
        ) : (
          (tab === 'voyages' ? [...listData].sort(byFavorite) : listData).map((item) =>
            tab === 'voyages' ? (
              <TripCard
                key={item.id}
                trip={item}
                onPress={() => navigation.navigate('TripDetail', { id: item.id })}
                onShare={() => shareListing(item, t)}
                favorite={favIds.includes(item.id)}
                onToggleFavorite={onToggleFavorite}
              />
            ) : (
              <DemandCard
                key={item.id}
                demand={item}
                onPress={() => navigation.navigate('DemandDetail', { id: item.id })}
                onPropose={() => navigation.navigate('DemandDetail', { id: item.id })}
              />
            )
          )
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bouton flottant + */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowPublish(true)} activeOpacity={0.9}>
        <Ionicons name="add" size={30} color={colors.white} />
      </TouchableOpacity>

      <PublishChoiceModal visible={showPublish} onClose={() => setShowPublish(false)} onChoose={onChoose} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 110 },
  hero: {
    marginHorizontal: '5%', marginTop: spacing.md, borderRadius: radius.lg,
    height: 190, overflow: 'hidden', ...shadow.card,
  },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9, 30, 55, 0.35)', // léger voile : les images sombres restent visibles
  },
  heroContent: { position: 'absolute', top: spacing.lg, left: spacing.lg, right: spacing.lg },
  brandSmall: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  greeting: { color: colors.white, fontSize: 22, fontWeight: '800', marginTop: 4 },
  subGreeting: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 2 },
  loginChip: {
    position: 'absolute', top: spacing.lg, right: spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 13, paddingVertical: 8, borderRadius: 22,
  },
  loginChipText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  bell: {
    position: 'absolute', top: spacing.lg, right: spacing.lg,
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute', top: -4, right: -6,
    minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.orange,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
    borderWidth: 1.5, borderColor: colors.white,
  },
  bellBadgeText: { color: colors.white, fontSize: 10, fontWeight: '900' },
  slideDots: { position: 'absolute', bottom: spacing.md, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  slideDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  slideDotActive: { backgroundColor: '#FFFFFF', width: 18 }, // point du slider héros : blanc fixe (sur photo sombre)
  tabs: {
    flexDirection: 'row', marginHorizontal: '5%', marginTop: spacing.md,
    backgroundColor: colors.card, borderRadius: 30, padding: 5, ...shadow.card,
  },
  tab: {
    flex: 1, height: 46, borderRadius: 26, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 6,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 15, fontWeight: '600', color: colors.muted },
  tabTextActive: { color: colors.white },
  search: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, marginHorizontal: '5%', marginTop: spacing.md,
    marginBottom: spacing.md, // micro espace avant la première publication
    borderRadius: radius.xl, paddingHorizontal: spacing.lg, height: 52, ...shadow.card,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: colors.text },
  fab: {
    position: 'absolute', right: 24, bottom: 100,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0B2545', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12,
    elevation: 8,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: spacing.lg, paddingBottom: spacing.xxl,
  },
  sheetHandle: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.lg },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: spacing.lg },
  option: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  optionIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  optionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  optionDesc: { fontSize: 13, color: colors.muted, marginTop: 4, lineHeight: 19 },
  cancel: { alignItems: 'center', marginTop: spacing.md, padding: spacing.sm },
  cancelText: { color: colors.muted, fontWeight: '600', fontSize: 15 },
});
