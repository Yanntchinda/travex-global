import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow, TRANSPORT_MODES } from '../../theme/theme';
import { ScreenHeader, Input, Button } from '../../components/common';
import PhotoPicker from '../../components/PhotoPicker';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { CATEGORIES } from '../../i18n/translations';
import Gate from '../../components/Gate';
import { createTrip } from '../../services/supabase';

export default function PublishTripScreen({ route, navigation }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const type = route.params?.type || 'voyage';
  const isVoyage = type === 'voyage';

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [transport, setTransport] = useState('Avion');
  const [price, setPrice] = useState('');
  const [weight, setWeight] = useState('');
  const [ticketPhoto, setTicketPhoto] = useState(null);
  // Catégories sélectionnées (1 ou plusieurs) + message du transporteur
  const [categories, setCategories] = useState([]);
  const [description, setDescription] = useState('');
  // Champs spécifiques à une DEMANDE d'expédition
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [urgency, setUrgency] = useState('flexible');
  const [category, setCategory] = useState('');
  const [parcelImage, setParcelImage] = useState(null);

  // Erreur visible + confirmation in-app (fiable sur web ET mobile).
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Modèle transparence : il faut un compte pour publier.
  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title={isVoyage ? t('publish.departureTitle') : t('publish.requestTitle')} onBack={() => navigation.goBack()} />
        <Gate
          icon="megaphone-outline"
          title={t('announce.gate')}
          subtitle={t('announce.gateDesc')}
          onLogin={() => navigation.navigate('SignIn')}
        />
      </SafeAreaView>
    );
  }

  const toggleCategory = (key) => {
    setCategories((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  const submit = async () => {
    setError(null);
    setSuccess(null);
    if (!from.trim() || !to.trim()) {
      setError(t('announce.notice'));
      return;
    }
    // Billet obligatoire pour un départ.
    if (isVoyage && !ticketPhoto) {
      setError(t('publish.ticketRequired'));
      return;
    }
    if (isVoyage && categories.length === 0) {
      setError(t('publish.categoriesRequired'));
      return;
    }
    const dateNeeded = isVoyage ? date.trim() : (deadline.trim() || date.trim());
    if (!dateNeeded) {
      setError(isVoyage ? t('publish.date') : t('demand.deadline'));
      return;
    }
    const reqCategory = category || (categories.length ? categories[0] : 'document');
    if (!isVoyage && !title.trim()) {
      setError(t('publish.categoriesRequired'));
      return;
    }
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || (user.name || '');
    const initials = fullName
      .split(/[\s.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase() || 'TR';
    const fromDate = dateNeeded;
    const arrivalDate = toDate.trim() || fromDate; // arrivée = date de départ si non renseignée
    const ann = {
      from: from.trim(),
      to: to.trim(),
      date: fromDate,
      fromDate,
      toDate: arrivalDate,
      transport: isVoyage ? transport : null,
      price,
      weight,
      pricePerKg: Number(price) || 0,
      capacityKg: Number(weight) || 0,
      categories: isVoyage ? categories : [reqCategory],
      description: description.trim(),
      // Toute publication part « en attente de vérification » : seul un
      // administrateur peut faire passer le statut à « vérifié » depuis son dashboard.
      status: 'attente',
      isDemande: !isVoyage,
      ticketPhoto: isVoyage ? ticketPhoto : null,
      // Champs demande
      title: isVoyage ? '' : title.trim(),
      deadline: isVoyage ? '' : (deadline.trim() || fromDate),
      urgency: isVoyage ? 'flexible' : urgency,
      category: isVoyage ? '' : reqCategory,
      weightNeeded: isVoyage ? 0 : Number(weight) || 0,
      budgetPerKg: isVoyage ? 0 : Number(price) || 0,
      parcelImage: isVoyage ? null : parcelImage,
      capacity: Number(weight) || 0,
      userEmail: user.email,
      userName: fullName,
      traveler: {
        name: fullName || 'Voyageur',
        initials,
        verified: !!user.verified,
        rating: 0,
        reviews: 0,
      },
    };
    setSubmitting(true);
    try {
      await createTrip(ann);
      const msg = isVoyage
        ? `Votre départ ${from} → ${to} (${transport}) du ${fromDate} est en attente de vérification. Un administrateur doit le valider depuis son tableau de bord.`
        : `Votre demande ${from} → ${to} à réceptionner avant le ${deadline.trim() || date.trim()} est publiée et en attente de vérification par un administrateur.`;
      setSuccess({ title: t('publish.ready'), msg });
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title={isVoyage ? t('publish.departureTitle') : t('publish.requestTitle')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.typeBox, isVoyage ? { backgroundColor: colors.primaryLight } : { backgroundColor: colors.accentLight }]}>
          <Text style={styles.typeBadge}>{isVoyage ? 'VOYAGEUR' : 'CLIENT'}</Text>
          <Text style={styles.typeText}>
            {isVoyage
              ? 'Vous voyagez et pouvez transporter des colis / documents.'
              : 'Vous cherchez un transporteur pour expédier vos colis / documents.'}
          </Text>
        </View>

        {/* Saisie libre des villes */}
        <Input label={t('publish.from')} icon="location-outline" placeholder={t('publish.enterCity')} value={from} onChangeText={setFrom} />
        <Input label={t('publish.to')} icon="flag-outline" placeholder={t('publish.enterCity')} value={to} onChangeText={setTo} />
        {isVoyage && (
          <>
            <Input label={t('publish.date')} icon="calendar-outline" placeholder="JJ.MM.AAAA (ex : 06.09.2026)" value={date} onChangeText={setDate} />
            <Input label={t('publish.arrival')} icon="calendar-outline" placeholder="JJ.MM.AAAA (arrivée — optionnel)" value={toDate} onChangeText={setToDate} />
          </>
        )}

        {isVoyage && (
          <>
            <Text style={styles.label}>{t('publish.transit')}</Text>
            <View style={styles.transportRow}>
              {TRANSPORT_MODES.map((tm) => (
                <TouchableOpacity
                  key={tm.key}
                  style={[styles.transportBtn, transport === tm.key && { backgroundColor: tm.color, borderColor: tm.color }]}
                  onPress={() => setTransport(tm.key)}
                >
                  <Ionicons name={tm.icon} size={18} color={transport === tm.key ? colors.white : tm.color} />
                  <Text style={[styles.transportText, transport === tm.key && { color: colors.white }]}>{tm.key}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Téléversement du billet — OBLIGATOIRE pour un départ */}
            <Text style={styles.label}>{t('publish.ticket')}</Text>
            <PhotoPicker
              value={ticketPhoto}
              onChange={setTicketPhoto}
              placeholder="Uploadez votre billet ou réservation de vol"
              hint="Obligatoire — l'annonce reste « en attente de confirmation » tant qu'un administrateur ne l'a pas validée"
            />

            {/* Types de colis — sélection multiple */}
            <Text style={styles.label}>{t('publish.categories')}</Text>
            <Text style={styles.hint}>{t('publish.categoriesHint')}</Text>
            <View style={styles.catWrap}>
              {CATEGORIES.map((c) => {
                const active = categories.includes(c.key);
                return (
                  <TouchableOpacity
                    key={c.key}
                    style={[styles.catChip, active && styles.catChipActive]}
                    onPress={() => toggleCategory(c.key)}
                  >
                    <Ionicons name={c.icon} size={18} color={active ? colors.white : colors.accent} />
                    <Text style={[styles.catText, active && { color: colors.white }]}>{t('cat.' + c.key)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Message du transporteur, visible dans les détails */}
            <Text style={styles.label}>{t('publish.description')}</Text>
            <View style={styles.descWrap}>
              <TextInput
                style={styles.descInput}
                placeholder={t('publish.descriptionPlaceholder')}
                placeholderTextColor="#9AA3AF"
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>
          </>
        )}

        {!isVoyage && (
          <>
            {/* Ce que vous souhaitez faire expédier */}
            <Text style={styles.label}>{t('demand.parcelTitle')}</Text>
            <Input
              icon="cube-outline"
              placeholder={t('demand.parcelTitlePh')}
              value={title}
              onChangeText={setTitle}
            />
            <Input
              label={t('demand.deadline')}
              icon="alarm-outline"
              placeholder={t('demand.deadlinePh')}
              value={deadline}
              onChangeText={setDeadline}
            />

            {/* Urgence */}
            <Text style={styles.label}>{t('demand.urgency')}</Text>
            <View style={styles.transportRow}>
              {[{ k: 'urgent', icon: 'flame', label: t('demand.urgent') }, { k: 'flexible', icon: 'calendar-outline', label: t('demand.flexible') }].map((u) => (
                <TouchableOpacity
                  key={u.k}
                  style={[styles.transportBtn, urgency === u.k && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                  onPress={() => setUrgency(u.k)}
                >
                  <Ionicons name={u.icon} size={18} color={urgency === u.k ? colors.white : colors.accent} />
                  <Text style={[styles.transportText, urgency === u.k && { color: colors.white, fontWeight: '800' }]}>{u.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Photo du colis (optionnel) */}
            <Text style={styles.label}>{t('demand.parcelImage')}</Text>
            <PhotoPicker
              value={parcelImage}
              onChange={setParcelImage}
              placeholder={t('demand.parcelImagePh')}
              hint={t('publish.optional')}
            />

            {/* Description du contenu */}
            <Text style={styles.label}>{t('demand.description')}</Text>
            <View style={styles.descWrap}>
              <TextInput
                style={styles.descInput}
                placeholder={t('publish.descriptionPlaceholder')}
                placeholderTextColor="#9AA3AF"
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>
          </>
        )}

        <Input
          label={isVoyage ? t('publish.price') : t('publish.budget')}
          icon="cash-outline"
          placeholder="ex : 10"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />
        <Input
          label={isVoyage ? t('publish.capacity') : t('publish.weight')}
          icon="cube-outline"
          placeholder="ex : 138"
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
        />

        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={colors.red} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Button
          title={isVoyage ? t('publish.submit') + ' (départ)' : t('publish.submit') + ' (demande)'}
          icon={isVoyage ? 'airplane-outline' : 'trending-up-outline'}
          onPress={submit}
          loading={submitting}
          style={{ marginTop: spacing.md }}
        />
      </ScrollView>

      {/* Confirmation de publication in-app */}
      <Modal transparent visible={!!success} animationType="fade" onRequestClose={() => { setSuccess(null); navigation.goBack(); }}>
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIcon}><Ionicons name="checkmark" size={30} color={colors.white} /></View>
            <Text style={styles.successTitle}>{success?.title}</Text>
            <Text style={styles.successBody}>{success?.msg}</Text>
            <Button title={t('demand.close') || 'OK'} onPress={() => { setSuccess(null); navigation.goBack(); }} style={{ marginTop: spacing.lg, width: '100%' }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 40 },
  typeBox: { borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  typeBadge: { fontSize: 12, fontWeight: '800', color: colors.primary, letterSpacing: 1, marginBottom: 4 },
  typeText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  label: { fontSize: 14, color: colors.text, fontWeight: '600', marginBottom: spacing.sm, marginTop: spacing.sm },
  hint: { fontSize: 12, color: colors.muted, marginBottom: spacing.sm },
  transportRow: { flexDirection: 'row', marginBottom: spacing.lg },
  transportBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 50, borderRadius: radius.sm, backgroundColor: colors.card, marginRight: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  transportText: { color: colors.primary, fontSize: 14, fontWeight: '600', marginLeft: 6 },
  catWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    borderRadius: 22, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border, marginRight: spacing.sm, marginBottom: spacing.sm,
  },
  catChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  catText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  descWrap: {
    backgroundColor: colors.inputBg, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md,
  },
  descInput: { minHeight: 90, fontSize: 15, color: colors.text, textAlignVertical: 'top' },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FDECEC', borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: '#F5C7C7', marginTop: spacing.md,
  },
  errorText: { flex: 1, color: colors.red, fontSize: 13, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  successCard: { width: '100%', maxWidth: 360, backgroundColor: colors.white, borderRadius: 24, padding: spacing.xl, alignItems: 'center', ...shadow.card },
  successIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 18, fontWeight: '900', color: colors.text, marginTop: spacing.md, textAlign: 'center' },
  successBody: { fontSize: 14, color: colors.text, marginTop: spacing.sm, lineHeight: 20, textAlign: 'center' },
});
