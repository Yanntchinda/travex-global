import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme/theme';
import { useLanguage } from '../context/LanguageContext';
import { getCniDocs } from '../services/supabase';
import { downloadDocument } from '../services/documents';

// ---------------------------------------------------------------------------
// Espace ADMIN : affiche les 3 documents d'identité d'un compte
// (CNI recto, CNI verso, selfie avec la CNI), en plein écran au tap, et permet
// de les TÉLÉCHARGER (fichier sur web, feuille de partage sur mobile).
// ---------------------------------------------------------------------------
function safeName(email) {
  return String(email || 'compte').split('@')[0].replace(/[^a-z0-9_-]/gi, '-');
}

export default function CniDocsView({ user, size = 110 }) {
  const { t } = useLanguage();
  const docs = getCniDocs(user);
  const [open, setOpen] = useState(null);
  const base = 'CNI-' + safeName(user && user.email);

  if (docs.length === 0) {
    return <Text style={styles.empty}>{t('admin.noDocs')}</Text>;
  }

  return (
    <View>
      <View style={styles.row}>
        {docs.map((d) => (
          <View key={d.key} style={[styles.cell, { width: size }]}>
            <TouchableOpacity activeOpacity={0.85} onPress={() => setOpen(d)} testID={'cniDoc-' + d.key}>
              <Image source={{ uri: d.uri }} style={[styles.thumb, { width: size, height: Math.round(size * 0.68) }]} resizeMode="cover" />
            </TouchableOpacity>
            <Text style={styles.cellLabel} numberOfLines={2}>{t(d.labelKey)}</Text>
            <TouchableOpacity
              style={styles.dlBtn}
              onPress={() => downloadDocument(d.uri, `${base}-${d.key}`)}
              activeOpacity={0.8}
              testID={'cniDownload-' + d.key}
            >
              <Ionicons name="download-outline" size={14} color="#fff" />
              <Text style={styles.dlText}>{t('admin.download')}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Visionneuse plein écran + téléchargement */}
      <Modal visible={!!open} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
        <View style={styles.viewer}>
          <View style={styles.viewerTop}>
            <Text style={styles.viewerTitle}>{open ? t(open.labelKey) : ''}</Text>
            <TouchableOpacity onPress={() => setOpen(null)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
          {open ? (
            <Image source={{ uri: open.uri }} style={styles.viewerImg} resizeMode="contain" />
          ) : null}
          <View style={styles.viewerActions}>
            <TouchableOpacity
              style={styles.viewerDl}
              activeOpacity={0.85}
              onPress={() => open && downloadDocument(open.uri, `${base}-${open.key}`)}
            >
              <Ionicons name="download-outline" size={18} color="#fff" />
              <Text style={styles.viewerDlText}>{t('admin.download')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cell: { marginRight: spacing.sm, marginBottom: spacing.sm },
  thumb: { borderRadius: radius.sm, backgroundColor: '#E2E8F0' },
  cellLabel: { fontSize: 11, color: colors.muted, marginTop: 4, fontWeight: '600', maxWidth: 110 },
  dlBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: colors.primary, borderRadius: radius.sm,
    paddingHorizontal: 8, paddingVertical: 4, marginTop: 4,
  },
  dlText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  empty: { fontSize: 13, color: colors.muted, fontStyle: 'italic' },

  viewer: { flex: 1, backgroundColor: 'rgba(2,6,23,0.96)', paddingTop: 48, paddingHorizontal: spacing.md },
  viewerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  viewerTitle: { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1 },
  viewerImg: { flex: 1, width: '100%', borderRadius: radius.md, backgroundColor: '#0B1220' },
  viewerActions: { paddingVertical: spacing.lg },
  viewerDl: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14,
  },
  viewerDlText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
