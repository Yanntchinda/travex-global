// ---------------------------------------------------------------------------
// Notifications push HORS application (Expo Push Service).
//
//   Android : FCM — gratuit, aucun compte Apple requis.      ← ACTIVÉ
//   iOS     : exige une clé APNs, donc un compte développeur Apple payant.
//             Désactivé tant que ce compte n'existe pas (voir isPushSupported()).
//
// Rien ne doit jamais faire planter l'app : émulateur sans Google Play, Expo Go
// (le push y est retiré sur Android depuis le SDK 53), permission refusée…
// chaque échec renvoie simplement `null`.
// ---------------------------------------------------------------------------
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { getSessionUser, savePushToken, addNotification } from './supabase';

// iOS restera désactivé jusqu'à l'obtention d'un compte Apple (clé APNs).
export function isPushSupported() {
  return Platform.OS === 'android';
}

let handlerSet = false;

// Demande la permission, crée le canal Android et renvoie le jeton Expo Push
// (enregistré pour le compte connecté). Renvoie null si indisponible.
export async function registerForPush() {
  if (!isPushSupported()) return null;
  try {
    if (!handlerSet) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      handlerSet = true;
    }

    // Canal Android obligatoire : sans canal, la notification est ignorée.
    await Notifications.setNotificationChannelAsync('default', {
      name: 'TRAVEX GLOBAL',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0043E0',
    });

    // Android 13+ : permission d'affichage à demander explicitement.
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return null;

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) return null;

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    const me = await getSessionUser();
    if (me && me.email && token) await savePushToken(me.email, token);
    return token || null;
  } catch (e) {
    return null;
  }
}

// Reflète les push reçus dans le fil in-app (cloche + capsule Dynamic Island).
let stopWatching = null;
export function watchPushNotifications() {
  if (!isPushSupported() || stopWatching) return () => {};
  try {
    const sub = Notifications.addNotificationReceivedListener((n) => {
      const c = (n && n.request && n.request.content) || {};
      const title = c.title || 'TRAVEX GLOBAL';
      const body = c.body || '';
      if (!title && !body) return;
      addNotification({
        type: 'info',
        title_fr: title, title_en: title,
        body_fr: body, body_en: body,
      });
    });
    stopWatching = () => { try { sub.remove(); } catch (e) {} stopWatching = null; };
    return stopWatching;
  } catch (e) {
    return () => {};
  }
}
