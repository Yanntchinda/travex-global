import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { ScreenHeader, Stars, Input, Button } from '../../components/common';
import { useAuth } from '../../context/AuthContext';

export default function PersonalInfoScreen({ navigation }) {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName || 'yann');
  const [lastName, setLastName] = useState(user?.lastName || 'Tchinda');
  const [email, setEmail] = useState(user?.email || 'yanntchinda813@gmail.com');
  const [edit, setEdit] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Informations personnelles"
        onBack={() => navigation.goBack()}
        rightIcon={edit ? 'close' : 'create-outline'}
        onRight={() => setEdit((v) => !v)}
      />

      <View style={styles.content}>
        {/* Carte profil */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.initials || 'YT'}</Text>
            <TouchableOpacity style={styles.camera}>
              <Ionicons name="camera" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
          <View style={{ marginLeft: spacing.lg, flex: 1 }}>
            <Text style={styles.name}>{firstName} {lastName}</Text>
            <Text style={styles.email2}>{email}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <Stars value={0} size={14} />
              <Text style={styles.reviews}>(0 avis)</Text>
            </View>
          </View>
        </View>

        <Text style={styles.section}>Détails personnels</Text>

        <View style={{ opacity: edit ? 1 : 0.9 }}>
          <Input label="Prénom" icon="person-outline" value={firstName} onChangeText={setFirstName} editable={edit} />
          <Input label="Nom" icon="person-outline" value={lastName} onChangeText={setLastName} editable={edit} />
          <Input label="Email" icon="mail-outline" value={email} onChangeText={setEmail} editable={edit} autoCapitalize="none" keyboardType="email-address" />
        </View>

        {edit && (
          <Button
            title="Enregistrer"
            onPress={() => { setEdit(false); setSaved(true); }}
            style={{ marginTop: spacing.md }}
          />
        )}
        {saved && !edit && (
          <Text style={styles.saved}>✔ Modifications enregistrées.</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.xl, ...shadow.card,
  },
  avatar: { width: 66, height: 66, borderRadius: 33, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontSize: 24, fontWeight: '800' },
  camera: { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.primaryLight, borderRadius: 14, padding: 4 },
  name: { fontSize: 17, fontWeight: '700', color: colors.text },
  email2: { fontSize: 14, color: colors.muted, marginTop: 2 },
  reviews: { fontSize: 13, color: colors.muted, marginLeft: 6 },
  section: { fontSize: 16, fontWeight: '700', color: colors.primaryDark, marginBottom: spacing.md },
  saved: { color: colors.green, fontWeight: '600', textAlign: 'center', marginTop: spacing.md },
});
