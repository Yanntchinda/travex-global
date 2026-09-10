import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme/theme';
import { Input, Button } from '../../components/common';
import { localStore } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';

export default function FinalizeSignupScreen({ route, navigation }) {
  const { setUser } = useAuth();
  const partial = route.params?.partial || {};
  const [firstName, setFirstName] = useState(partial.firstName || 'yann');
  const [lastName, setLastName] = useState(partial.lastName || 'Tchinda');
  const [email, setEmail] = useState(partial.email || 'yanntchinda813@gmail.com');
  const [accepted, setAccepted] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!accepted) {
      Alert.alert('Conditions requises', 'Veuillez accepter les conditions d\u2019utilisation.');
      return;
    }
    setLoading(true);
    const user = {
      id: 'u_' + Date.now(),
      firstName,
      lastName,
      email,
      initials: ((firstName || 'Y')[0] + (lastName || 'T')[0]).toUpperCase(),
      verified: false,
      stats: { voyages: 0, demandes: 0, note: 0 },
    };
    await localStore.set('travex.user', user);
    await localStore.set('travex.session', 'active');
    setUser(user);
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finaliser l’inscription</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          Vérifiez les informations de votre compte Google et acceptez les conditions pour
          terminer la création de votre compte TRAVEX.
        </Text>

        <Input label="Prénom" value={firstName} onChangeText={setFirstName} />
        <Input label="Nom de famille" value={lastName} onChangeText={setLastName} />
        <Input
          label="Adresse e-mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => setAccepted((v) => !v)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={accepted ? 'checkbox' : 'square-outline'}
            size={24}
            color={accepted ? colors.primary : colors.muted}
          />
          <Text style={styles.checkText}>
            J’accepte les <Text style={{ color: colors.primary }}>Conditions d’utilisation</Text> et{' '}
            <Text style={{ color: colors.primary }}>politique de confidentialité</Text>.
          </Text>
        </TouchableOpacity>

        <Button title="Créer mon compte" onPress={handleSubmit} loading={loading} style={{ marginTop: spacing.md }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
  },
  headerBtn: { width: 40, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.primaryDark },
  content: { paddingHorizontal: '5%', paddingVertical: spacing.lg },
  intro: { fontSize: 15, color: colors.text, lineHeight: 22, marginBottom: spacing.xl },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.sm },
  checkText: { flex: 1, marginLeft: spacing.sm, fontSize: 15, color: colors.text, lineHeight: 22 },
});
