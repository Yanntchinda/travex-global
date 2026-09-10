// ---------------------------------------------------------------------------
// Partage multi-plateforme (web + natif).
//   - Web moderne  : API navigator.share (menu de partage du navigateur)
//   - Web ancien   : copie dans le presse-papiers + confirmation
//   - iOS/Android  : Share.share (feuille de partage native)
// ---------------------------------------------------------------------------
import { Platform, Share, Alert } from 'react-native';

export async function shareContent({ title, message, url }) {
  const text = [message, url].filter(Boolean).join('\n');
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, text, url });
        return true;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText([title, text].filter(Boolean).join('\n'));
        Alert.alert(title || 'Partagé', 'Copié dans le presse-papiers !');
        return true;
      }
      return false;
    }
    const res = await Share.share({ title, message: text, url });
    return res.action !== Share.dismissedAction;
  } catch (e) {
    // Annulation utilisateur ou erreur — silencieux.
    return false;
  }
}

// Partage une annonce (départ ou demande) avec un message formaté.
export function shareListing(item, t) {
  const from = item.from || '';
  const to = item.to || '';
  const date = item.fromDate || item.date || '';
  const price = item.pricePerKg ? `${item.pricePerKg} €/kg` : '';
  const title = 'TRAVEX GLOBAL';
  const message = [
    item.isDemande ? 'Demande d\u2019expédition' : 'Départ de voyageur',
    `${from} → ${to}`,
    date ? `Date : ${date}` : '',
    price ? `Tarif : ${price}` : '',
    '— envoyé depuis TRAVEX GLOBAL',
  ].filter(Boolean).join('\n');
  return shareContent({ title, message, url: 'https://travexglobal.com' });
}
