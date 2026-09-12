// Version WEB : le push natif n'existe pas ici. Ce fichier est résolu
// automatiquement par Metro à la place de push.js sur la plateforme web,
// ce qui évite d'embarquer (et d'exécuter) expo-notifications dans le bundle web.
export function isPushSupported() {
  return false;
}

export async function registerForPush() {
  return null;
}

export function watchPushNotifications() {
  return () => {};
}
