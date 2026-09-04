import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme/theme';
import { EmptyState } from '../../components/common';

export default function ReservationsScreen() {
  const [tab, setTab] = useState('clients');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Réservations</Text>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'clients' && styles.tabActive]} onPress={() => setTab('clients')}>
          <Text style={[styles.tabText, tab === 'clients' && styles.tabTextActive]}>Réservations clients</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'mes' && styles.tabActive]} onPress={() => setTab('mes')}>
          <Text style={[styles.tabText, tab === 'mes' && styles.tabTextActive]}>Mes réservations</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        <EmptyState
          icon="calendar-outline"
          title="Aucune réservation pour le moment."
          subtitle={tab === 'clients'
            ? 'Les réservations des clients apparaîtront ici.'
            : 'Vos réservations apparaîtront ici.'}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  title: { fontSize: 22, fontWeight: '800', color: colors.primaryDark, textAlign: 'center', paddingVertical: spacing.md },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, height: 48, alignItems: 'center', justifyContent: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: colors.primary },
  tabText: { fontSize: 15, color: colors.text },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
});
