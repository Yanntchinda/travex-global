import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme/theme';
import { EmptyState } from '../../components/common';

export default function MessagesScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Messages</Text>
      <View style={{ flex: 1 }}>
        <EmptyState
          icon="chatbubble-ellipses-outline"
          title="Aucune conversation"
          subtitle="Contactez un voyageur pour commencer une conversation."
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  title: { fontSize: 22, fontWeight: '800', color: colors.primaryDark, textAlign: 'center', paddingVertical: spacing.md },
});
