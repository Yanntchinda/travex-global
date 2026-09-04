import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme/theme';
import { EmptyState } from '../../components/common';

export default function AnoncesScreen() {
  const [tab, setTab] = useState('voyages');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Mes annonces</Text>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'voyages' && styles.tabActive]} onPress={() => setTab('voyages')}>
          <Text style={[styles.tabText, tab === 'voyages' && styles.tabTextActive]}>Mes voyages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'demandes' && styles.tabActive]} onPress={() => setTab('demandes')}>
          <Text style={[styles.tabText, tab === 'demandes' && styles.tabTextActive]}>Mes demandes</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        <EmptyState
          icon="calendar-outline"
          title={tab === 'voyages' ? 'Aucun voyage trouvé' : 'Aucune demande trouvée'}
          subtitle={tab === 'voyages'
            ? 'Vous n\u2019avez encore créé aucun voyage.'
            : 'Vous n\u2019avez encore créé aucune demande.'}
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
