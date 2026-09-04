import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { ScreenHeader, Input, Button } from '../../components/common';

const CITIES = ['Douala', 'Yaoundé', 'Genève', 'Paris', 'Bruxelles', 'Montréal', 'Londres'];

function CityPicker({ label, value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.picker} onPress={() => setOpen((v) => !v)}>
        <Ionicons name="location-outline" size={20} color={colors.muted} />
        <Text style={[styles.pickerText, !value && { color: '#9AA3AF' }]}>{value || 'Choisir une ville'}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
      </TouchableOpacity>
      {open && (
        <View style={styles.dropdown}>
          {CITIES.map((c) => (
            <TouchableOpacity key={c} style={styles.dropdownRow} onPress={() => { onChange(c); setOpen(false); }}>
              <Text style={styles.dropdownText}>{c}</Text>
              {value === c && <Ionicons name="checkmark" size={18} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function PublishTripScreen({ navigation }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [transport, setTransport] = useState('Avion');
  const [priceKg, setPriceKg] = useState('');
  const [weight, setWeight] = useState('');

  const submit = () => {
    if (!from || !to || !date) {
      Alert.alert('Champs requis', 'Veuillez renseigner la ville de départ, d\u2019arrivée et la date.');
      return;
    }
    Alert.alert('Annonce publiée', `Votre voyage ${from} → ${to} du ${date} est prêt.\n\n(La publication réelle se fera avec la base de données connectée.)`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Publier une annonce" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Text style={styles.intro}>
          Renseignez votre départ pour permettre aux gens de vous confier leurs colis et documents.
        </Text>

        <CityPicker label="Ville de départ" value={from} onChange={setFrom} />
        <CityPicker label="Ville d’arrivée" value={to} onChange={setTo} />

        <Input label="Date de départ" icon="calendar-outline" placeholder="JJ.MM.AAAA (ex : 06.09.2026)" value={date} onChangeText={setDate} />

        <Text style={styles.label}>Mode de transport</Text>
        <View style={styles.transportRow}>
          {['Avion', 'Voiture', 'Bus'].map((t) => (
            <TouchableOpacity key={t} style={[styles.transportBtn, transport === t && styles.transportActive]} onPress={() => setTransport(t)}>
              <Ionicons name={t === 'Avion' ? 'airplane' : t === 'Voiture' ? 'car' : 'bus'} size={18} color={transport === t ? colors.white : colors.primary} />
              <Text style={[styles.transportText, transport === t && { color: colors.white }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input label="Tarif (€/kg)" icon="cash-outline" placeholder="ex : 10" value={priceKg} onChangeText={setPriceKg} keyboardType="numeric" />
        <Input label="Capacité (kg)" icon="cube-outline" placeholder="ex : 138" value={weight} onChangeText={setWeight} keyboardType="numeric" />

        <Button title="Publier l\u2019annonce" icon="paper-plane-outline" onPress={submit} style={{ marginTop: spacing.md }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  intro: { fontSize: 14, color: colors.muted, lineHeight: 21, marginBottom: spacing.lg },
  label: { fontSize: 14, color: colors.text, fontWeight: '600', marginBottom: spacing.sm },
  picker: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, height: 56, paddingHorizontal: spacing.md,
  },
  pickerText: { flex: 1, marginLeft: 10, fontSize: 15, color: colors.text },
  dropdown: { backgroundColor: colors.card, borderRadius: radius.sm, marginTop: 4, ...shadow.card, overflow: 'hidden' },
  dropdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  dropdownText: { fontSize: 15, color: colors.text },
  transportRow: { flexDirection: 'row', marginBottom: spacing.lg },
  transportBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 48, borderRadius: radius.sm, backgroundColor: colors.card, marginRight: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  transportActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  transportText: { color: colors.primary, fontSize: 14, fontWeight: '600', marginLeft: 6 },
});
