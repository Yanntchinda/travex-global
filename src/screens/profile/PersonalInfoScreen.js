import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../../theme/theme';
import { ScreenHeader, Stars, Input, Button } from '../../components/common';
import PhotoPicker from '../../components/PhotoPicker';
import { useAuth } from '../../context/AuthContext';
import { updateUser } from '../../services/supabase';

export default function PersonalInfoScreen({ navigation }) {
  const { user, setUser } = useAuth();
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [location, setLocation] = useState(user?.location || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [edit, setEdit] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    const updated = await updateUser({ firstName, lastName, email, location, phone, avatar });
    setUser(updated);
    setEdit(false);
    setSaved(true);
    Alert.alert('Enregistré', 'Votre profil a été mis à jour.');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader
        title="Informations personnelles"
        onBack={() => navigation.goBack()}
        rightIcon={edit ? 'checkmark' : 'create-outline'}
        onRight={() => (edit ? save() : setEdit(true))}
      />

      <View style={styles.content}>
        <Text style={styles.label}>Photo de profil (visible par tous)</Text>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            {avatar ? <Image source={{ uri: avatar }} style={styles.avatarImg} /> : <Text style={styles.avatarText}>{user?.initials || '—'}</Text>}
          </View>
          <View style={{ flex: 1, marginLeft: spacing.lg }}>
            <Text style={styles.name}>{firstName} {lastName}</Text>
            <Text style={styles.email2}>{email}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
              <Stars value={0} size={14} />
              <Text style={styles.reviews}>(0 avis)</Text>
            </View>
          </View>
        </View>

        <View style={{ marginBottom: spacing.lg }}>
          <PhotoPicker
            label="Ajouter / changer la photo"
            value={avatar}
            onChange={setAvatar}
            placeholder="Téléversez votre photo de profil"
          />
        </View>

        <Text style={styles.section}>Détails personnels</Text>
        <View style={{ opacity: edit ? 1 : 0.9 }}>
          <Input label="Prénom" icon="person-outline" value={firstName} onChangeText={setFirstName} editable={edit} />
          <Input label="Nom" icon="person-outline" value={lastName} onChangeText={setLastName} editable={edit} />
          <Input label="Localisation" icon="location-outline" value={location} onChangeText={setLocation} editable={edit} />
          <Input label="Contact (téléphone)" icon="call-outline" value={phone} onChangeText={setPhone} editable={edit} keyboardType="phone-pad" />
          <Input label="Email" icon="mail-outline" value={email} onChangeText={setEmail} editable={edit} autoCapitalize="none" keyboardType="email-address" />
        </View>

        {edit && <Button title="Enregistrer" onPress={save} style={{ marginTop: spacing.md }} />}
        {saved && !edit && <Text style={styles.saved}>✔ Modifications enregistrées.</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: '5%', paddingVertical: spacing.lg },
  label: { fontSize: 14, color: colors.text, fontWeight: '600', marginBottom: spacing.md },
  avatarRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, ...shadow.card,
  },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: 72, height: 72, borderRadius: 36 },
  avatarText: { color: colors.white, fontSize: 26, fontWeight: '800' },
  name: { fontSize: 17, fontWeight: '700', color: colors.text },
  email2: { fontSize: 14, color: colors.muted, marginTop: 2 },
  reviews: { fontSize: 13, color: colors.muted, marginLeft: 6 },
  section: { fontSize: 16, fontWeight: '700', color: colors.primaryDark, marginBottom: spacing.md },
  saved: { color: colors.green, fontWeight: '600', textAlign: 'center', marginTop: spacing.md },
});
