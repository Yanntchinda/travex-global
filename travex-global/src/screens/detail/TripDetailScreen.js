import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { ScreenHeader, Stars, Badge, Loading, Button } from '../../components/common';
import { CountryFlag, TransportIcon, RouteLine } from '../../components/trip';
import { fetchTripDetail } from '../../services/supabase';
import { CITIES } from '../../data/mockData';

function OptionSheet({ visible, onClose }) {
  const options = [
    { icon: 'person-outline', label: 'Voir le profil' },
    { icon: 'share-social-outline', label: 'Partager le voyage' },
    { icon: 'eye-off-outline', label: 'Masquer le voyage' },
    { icon: 'flag-outline', label: 'Signaler l\u2019utilisateur', danger: true },
  ];
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          {options.map((o, i) => (
            <TouchableOpacity key={i} style={styles.optionRow} onPress={() => { onClose(); }}>
              <Ionicons name={o.icon} size={22} color={o.danger ? colors.red : colors.primary} />
              <Text style={[styles.optionText, o.danger && { color: colors.red }]}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function TripDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [detail, setDetail] = useState(null);
  const [sheet, setSheet] = useState(false);

  useEffect(() => { fetchTripDetail(id).then(setDetail).catch(() => {}); }, [id]);

  if (!detail) return <Loading />;

  const { traveler, route: r, info, prohibited, notice } = detail;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Détails du voyage" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Carte voyageur */}
        <View style={styles.card}>
          <View style={styles.travelerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{traveler.initials}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.travelerName}>{traveler.name}</Text>
              <Badge label={traveler.badge || 'Voyageur'} color={colors.green} icon="checkmark-circle" />
              <View style={styles.ratingRow}>
                <Stars value={traveler.rating} size={16} />
                <Text style={styles.reviews}>{traveler.reviews} avis</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setSheet(true)} style={styles.moreBtn}>
              <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Carte route */}
        <View style={styles.card}>
          <RouteLine from={r.from} to={r.to} fromDate={r.fromDate} toDate={r.toDate} transport={r.transport} />
        </View>

        {/* Informations sur le voyage */}
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Informations sur le voyage</Text>
          </View>
          {info.map((it, i) => (
            <View key={i} style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name={it.icon === 'document' ? 'document-text-outline' : it.icon === 'valise' ? 'briefcase-outline' : 'cube-outline'}
                  size={18} color={colors.orange}
                />
              </View>
              <View style={{ marginLeft: spacing.md }}>
                <Text style={styles.infoTitle}>{it.title}</Text>
                <Text style={styles.infoDetail}>{it.detail}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Objets non transportés */}
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="ban-outline" size={20} color={colors.red} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Objets non transportés</Text>
          </View>
          <View style={styles.prohibitedWrap}>
            {prohibited.map((p, i) => (
              <View key={i} style={styles.prohibited}>
                <Ionicons name="close" size={14} color={colors.red} />
                <Text style={styles.prohibitedText}>{p}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Avis important */}
        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="alert-circle" size={20} color={colors.red} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Avis important</Text>
          </View>
          <Text style={styles.notice}>{notice}</Text>
        </View>
      </ScrollView>

      {/* Barre d'actions */}
      <View style={styles.actionBar}>
        <Button title="Contacter" variant="green" icon="chatbubbles-outline" onPress={() => navigation.navigate('Main', { screen: 'Messages' })} style={{ flex: 1, marginRight: spacing.sm }} />
        <Button title="Réserver" icon="arrow-forward" onPress={() => Alert.alert('Réservation', 'La réservation sera disponible avec la base de données connectée.')} style={{ flex: 1, marginLeft: spacing.sm }} />
      </View>

      <OptionSheet visible={sheet} onClose={() => setSheet(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    marginBottom: spacing.md, ...shadow.card,
  },
  travelerRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.primary,
  },
  avatarText: { color: colors.primary, fontWeight: '800', fontSize: 18 },
  travelerName: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  reviews: { fontSize: 13, color: colors.muted, marginLeft: 6 },
  moreBtn: { padding: 8 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.primaryDark, marginLeft: 8 },
  infoItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.inputBg, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.sm,
  },
  infoIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  infoTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  infoDetail: { fontSize: 14, color: colors.muted, marginTop: 3 },
  prohibitedWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  prohibited: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FBEAEA', borderRadius: radius.sm,
    paddingHorizontal: spacing.md, paddingVertical: 10, margin: 4,
  },
  prohibitedText: { color: colors.red, fontWeight: '600', marginLeft: 6, fontSize: 13 },
  notice: { fontSize: 15, color: colors.text, lineHeight: 23 },
  actionBar: {
    flexDirection: 'row', padding: spacing.lg, backgroundColor: colors.white,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg, paddingBottom: spacing.xxl,
  },
  sheetHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.lg },
  optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  optionText: { fontSize: 16, color: colors.primaryDark, marginLeft: spacing.lg, fontWeight: '600' },
});
