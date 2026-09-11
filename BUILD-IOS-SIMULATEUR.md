# 📱 Build iOS SIMULATEUR — Tester TRAVEX GLOBAL SANS certificat Apple

> **Objectif :** installer et tester l'application sur un **simulateur iOS**
> **avant** de payer le compte développeur Apple (99 €/an).
>
> ⚠️ **Important :** le simulateur ne nécessite **aucun certificat ni profil de
> provisionnement**. Ce n'est qu'au moment de tester sur un **vrai iPhone** ou de
> publier sur l'App Store que le compte payant devient nécessaire.

---

## Option A — EAS Build (recommandée, sans Mac) ☁️

Le build tourne sur les serveurs d'Expo. Vous récupérez un fichier `.app`
à glisser dans le simulateur. **Aucun certificat Apple requis.**

### 1. Préparer le simulateur (une seule fois, sur votre Mac)

```bash
# Xcode est requis pour le simulateur (gratuit sur le Mac App Store)
xcode-select --install        # si Xcode non installé
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
xcodebuild -downloadPlatform iOS   # télécharge les runtimes simulateur
```

Ouvrir ensuite **Simulator** :

```bash
open -a Simulator   # démarre un iPhone simulé
```

### 2. Lancer le build (depuis le dossier du projet)

```bash
npm install -g eas-cli     # une seule fois
eas login                  # compte Expo gratuit (https://expo.dev)

npm run build:ios-sim      # = eas build -p ios --profile preview-ios
```

Le profil `preview-ios` est déjà configuré dans `eas.json` :

```json
"preview-ios": {
  "distribution": "internal",
  "ios": { "simulator": true }
}
```

### 3. Installer l'application dans le simulateur

En fin de build, EAS donne une **URL de téléchargement** :

```bash
# Télécharger et décompresser (le fichier se nomme comme travexglobal.tar.gz)
curl -o app.tar.gz "<URL-du-build-EAS>"
tar -xvzf app.tar.gz

# Installer le .app dans le simulateur OUVERT
xcrun simctl install booted Build/Products/*.app
xcrun simctl launch booted com.travexglobal.app
```

**Ou tout simplement :** glisser-déposer le fichier `.app` extrait sur la
fenêtre du simulateur ouvert. 🎉

---

## Option B — Build local avec Xcode (si vous avez un Mac) 💻

```bash
npm install
npm run prebuild:ios        # génère le dossier ios/ natif
npx expo run:ios            # compile + lance dans le simulateur ouvert
```

Aucun compte Apple payant n'est demandé pour le simulateur ; Xcode peut
demander une connexion Apple ID gratuite pour le « signing local ».

---

## Option C — Application de développement EAS (test rapide)

```bash
npm install -g eas-cli && eas login
eas build -p ios --profile development
```

> Nécessite Expo Go / un development build ; le plus simple reste l'option A.

---

## Identifiants de test (mode démo)

| Élément | Valeur |
|---|---|
| Connexion démo | `demo@travexglobal.com` / `Demo1234!` |
| Bundle ID iOS | `com.travexglobal.app` |
| Profil EAS simulateur | `preview-ios` |

---

## ✅ Quand payer Apple ?

| Étape | Compte payant Apple (99 €/an) |
|---|---|
| Simulateur iOS | ❌ Non nécessaire |
| iPhone réel (via TestFlight ou câble) | ✅ Oui |
| Publication App Store | ✅ Oui |

Le jour venu : `eas submit -p ios` s'occupe de tout avec vos identifiants
App Store Connect.
