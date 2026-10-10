import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors } from '../theme/theme';

// Logo officiel TRAVEX GLOBAL (image transparente fournie).
// Fallback : si l'image manque, affiche l'identité textuelle.
export default function Logo({ width = 200, height = 90, showText = true }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Image
        source={require('../../assets/logo.png')}
        style={{ width, height, resizeMode: 'contain' }}
      />
      {showText && (
        <Text style={styles.subText}>Transit de colis</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  subText: {
    marginTop: 8,
    fontSize: 13,
    color: colors.muted,
    letterSpacing: 0.5,
  },
});
