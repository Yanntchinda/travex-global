import React, { useState } from 'react';
import { View } from 'react-native';
import { Input, Button } from './common';

export function LoginForm({ busy, onSubmit }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <View>
      <Input label="E-mail" icon="mail-outline" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <Input label="Mot de passe" icon="lock-closed-outline" value={password} onChangeText={setPassword} secureTextEntry onSubmitEditing={() => onSubmit({ email, password })} />
      <Button title="Se connecter" icon="log-in-outline" loading={busy} onPress={() => onSubmit({ email, password })} />
    </View>
  );
}

export function RegisterForm({ busy, onSubmit }) {
  const [f, setF] = useState({ firstName: '', lastName: '', email: '', phone: '', city: '', password: '' });
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
  return (
    <View>
      <Input label="Prénom *" value={f.firstName} onChangeText={set('firstName')} />
      <Input label="Nom *" value={f.lastName} onChangeText={set('lastName')} />
      <Input label="E-mail *" icon="mail-outline" value={f.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" />
      <Input label="Téléphone *" icon="call-outline" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" placeholder="+237 6 00 00 00 00" />
      <Input label="Ville de résidence" icon="location-outline" value={f.city} onChangeText={set('city')} />
      <Input label="Mot de passe * (6 caractères minimum)" icon="lock-closed-outline" value={f.password} onChangeText={set('password')} secureTextEntry />
      <Button title="Créer mon compte" icon="person-add-outline" loading={busy} onPress={() => onSubmit(f)} />
    </View>
  );
}
