# 🔔 Notifications push (hors application) — TRAVEX GLOBAL

> **État du projet** : le push est **codé et actif pour Android** (FCM).
> **iOS est volontairement désactivé** : la clé APNs exige un **compte
> développeur Apple payant** (99 €/an) — voir `isPushSupported()` dans
> `src/services/push.js`.

| Plateforme | Service | Coût | Statut |
|---|---|---|---|
| Android | FCM (Firebase) | gratuit | ✅ codé, à crédentialiser |
| iOS | APNs (Apple) | 99 €/an | ⏸️ désactivé tant qu'il n'y a pas de compte Apple |

---

## 1. Ce qui est déjà dans le code

| Fichier | Rôle |
|---|---|
| `src/services/push.js` | Android : canal de notification, permission Android 13+, jeton Expo Push enregistré par compte (`savePushToken`), push reçus reflétés dans le fil in-app. |
| `src/services/push.web.js` | Stub web (résolu automatiquement par Metro) : le push natif n'existe pas dans le navigateur. |
| `App.js` → `<PushRegistrar />` | Enregistre le jeton du compte connecté et écoute les notifications entrantes. |
| `app.json` | Plugin `expo-notifications` (icône + couleur de la notification). |

⚠️ **Un nouveau build natif est obligatoire** : `expo-notifications` est un
module natif, une mise à jour OTA (`eas update`) ne peut pas l'ajouter.

---

## 2. Android — credentials FCM (gratuit, sans compte Apple)

1. **Créer un projet Firebase** sur https://console.firebase.google.com (gratuit).
2. *Paramètres du projet* → **Comptes de service** → **Générer une nouvelle clé privée**
   → un fichier JSON est téléchargé. **C'est ce fichier qu'Expo attend.**
3. Le téléverser sur EAS :

```bash
eas credentials
# → choisir Android
# → Push Notifications: Manage credentials
# → Upload a new Google Services Account key (FCM V1)
# → sélectionner le fichier JSON téléchargé à l'étape 2
```

4. Builder :

```bash
npm run build:apk
```

5. **Tester** : ouvrir https://expo.dev/notifications, coller le jeton
   `ExponentPushToken[...]` affiché dans les logs de `npx expo start`, écrire un
   titre et un message, puis **Send a Notification**.

> Le push ne fonctionne **pas dans Expo Go** (retiré sur Android depuis le SDK 53)
> et **pas sur émulateur sans Google Play** : testez sur un vrai téléphone avec
> l'APK installé. Dans ces cas, `registerForPush()` renvoie `null` sans planter.

---

## 3. iOS — quand vous aurez le compte Apple

```bash
eas credentials
# → choisir iOS
# → Push Notifications: Manage credentials
# → Generate a new Apple Push Notifications service key
```

Puis, dans `src/services/push.js`, autoriser iOS :

```js
export function isPushSupported() {
  return Platform.OS === 'android' || Platform.OS === 'ios';
}
```

et rebuilder (`eas build -p ios --profile production`).

---

## 4. Envoyer une notification à tous les comptes vérifiés

Le backend doit :

1. lire les jetons des destinataires — table `push_tokens` (voir
   `SUPABASE-NOTIFICATIONS.sql`), filtrés sur `profiles.verified = true` ;
2. appeler l'API Expo Push :

```bash
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -d '[{
        "to": ["ExponentPushToken[XXXX]", "ExponentPushToken[YYYY]"],
        "title": "Nouveau départ publié 📢",
        "body": "Awa N. · Douala → Paris · 12.09.2026",
        "data": { "type": "newListing", "tripId": "…" }
      }]'
```

Le champ `data.type` est repris par l'app : la notification reçue est ajoutée au
fil in-app (cloche + capsule) avec le bon type.

---

## 5. Diffusion in-app (déjà active)

Même sans push, chaque publication est notifiée **dans l'application** à tous les
comptes dont la CNI est validée (`broadcastNewListing()` dans
`src/services/supabase.js`), l'auteur étant exclu. En mode démo, la diffusion est
visible sur l'appareil du compte vérifié connecté ; en mode cloud, elle passera
par la table `notifications` et la fonction `notify_verified_new_listing()`
décrites dans `SUPABASE-NOTIFICATIONS.sql`.

Vérifier le comportement à tout moment :

```bash
npm run check     # 52 vérifications du code réel (statuts, PIN, diffusion, écrans)
```
