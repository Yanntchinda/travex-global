// ---------------------------------------------------------------------------
// Téléchargement / enregistrement des documents d'identité (CNI recto, verso,
// selfie avec CNI) et des billets de voyage.
//
//   Web     : vrai téléchargement navigateur (ancre <a download>).
//   Android / iOS : le document est écrit dans le cache puis proposé à la
//                   feuille de partage système (« Enregistrer dans Fichiers »,
//                   Drive, e-mail…).
//
// En mode démo les documents sont stockés en base64 (AsyncStorage) : ils sont
// donc affichables ET téléchargeables depuis l'espace admin. En mode cloud,
// les mêmes URI seront remplacés par des URL Supabase Storage.
// ---------------------------------------------------------------------------
import { Platform, Share, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

// « data:image/jpeg;base64,XXXX » → « XXXX » (les URL http sont renvoyées telles quelles).
export function dataUriToBase64(dataUri) {
  const s = String(dataUri || '');
  const i = s.indexOf('base64,');
  return i >= 0 ? s.slice(i + 7) : '';
}

export function mimeFromDataUri(dataUri) {
  const m = /^data:([^;,]+)/.exec(String(dataUri || ''));
  return (m && m[1]) || 'image/jpeg';
}

export function extFromDataUri(dataUri) {
  const mime = mimeFromDataUri(dataUri);
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('heic')) return 'heic';
  return 'jpg';
}

export function isDataUri(uri) {
  return /^data:[^;,]+;base64,/.test(String(uri || ''));
}

function downloadWeb(uri, filename) {
  try {
    if (typeof document === 'undefined') return false;
    const a = document.createElement('a');
    a.href = uri;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch (e) {
    return false;
  }
}

// Ouvre le document : téléchargement direct sur web, partage système sur mobile.
// Retourne true si une action a bien été déclenchée.
export async function downloadDocument(uri, filename = 'travex-document') {
  if (!uri) return false;
  const name = /\.[a-z0-9]+$/i.test(filename) ? filename : `${filename}.${extFromDataUri(uri)}`;

  if (Platform.OS === 'web') {
    if (isDataUri(uri)) return downloadWeb(uri, name);
    // Image distante : on l'ouvre dans un onglet (le navigateur propose l'enregistrement).
    try {
      const win = typeof window !== 'undefined' ? window.open(uri, '_blank') : null;
      return !!win;
    } catch (e) {
      return false;
    }
  }

  try {
    let localUri = uri;
    // Une image distante est d'abord rapatriée dans le cache.
    if (!isDataUri(uri)) {
      const dest = `${FileSystem.cacheDirectory || ''}${name}`;
      const res = await FileSystem.downloadAsync(uri, dest);
      localUri = res.uri;
    } else {
      const dest = `${FileSystem.cacheDirectory || ''}${name}`;
      await FileSystem.writeAsStringAsync(dest, dataUriToBase64(uri), {
        encoding: FileSystem.EncodingType.Base64,
      });
      localUri = dest;
    }

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(localUri, {
        mimeType: mimeFromDataUri(uri),
        dialogTitle: name,
        UTI: `public.${extFromDataUri(uri) === 'jpg' ? 'jpeg' : extFromDataUri(uri)}`,
      });
      return true;
    }
    // Pas de partage disponible : on retombe sur la feuille système RN.
    await Share.share({ message: localUri, url: localUri });
    return true;
  } catch (e) {
    Alert.alert('Téléchargement impossible', String((e && e.message) || e));
    return false;
  }
}
