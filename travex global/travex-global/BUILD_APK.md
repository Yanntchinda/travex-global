# TRAVEX GLOBAL — Générer l'APK Android

Ce dossier contient le projet **React Native / Expo** complet de TRAVEX GLOBAL.
Il est déjà configuré pour produire un **APK installable** :

- `app.json` → nom, icône, splash, package Android `com.travexglobal.app`, versionCode, permissions et plugin appareil photo/galerie.
- `eas.json` → profil **`preview`** qui génère un **APK** (et non un AAB).

---

## 1. Prérequis (une seule fois)

```bash
# Node.js 18+ puis :
npm install -g eas-cli
```

Créez un compte gratuit sur https://expo.dev si vous n'en avez pas.

---

## 2. Se connecter

```bash
cd travex-global
npm install
eas login
```

> Le projet est déjà lié à l'identifiant EAS `773d6b4f-1108-4f46-aa07-34169d7ab8a0`.
> Si EAS vous demande de lier : `eas init` (ou remplacez le `projectId` dans `app.json`).

---

## 3. Lancer le build APK

```bash
eas build -p android --profile preview
```

- EAS compile dans le cloud (8–15 min).
- À la fin, un **lien de téléchargement du `.apk`** s'affiche dans le terminal.
- Vous pouvez aussi suivre le build sur votre tableau de bord : https://expo.dev/accounts → *Projects → travex-global → Builds*.

---

## 4. Installer l'APK sur le téléphone

1. Téléchargez le fichier `.apk` depuis le lien.
2. Transférez-le sur le téléphone (câble, Google Drive, WhatsApp…).
3. Ouvrez-le et autorisez **« Installer des applications inconnues »** si demandé.
4. L'application **TRAVEX GLOBAL** s'installe avec son icône.

---

## 5. (Option) Tester d'abord la version web

```bash
npx expo start --web
```

---

## 6. Autres profils de build

| Profil | Commande | Résultat |
|---|---|---|
| `preview` | `eas build -p android --profile preview` | **APK** installable (partage direct) |
| `production` | `eas build -p android --profile production` | AAB pour le Play Store |
| développement | `eas build -p android --profile development` | Build de dev (dev client) |

---

## 7. (Option) Build local avec Android Studio

Si vous préférez compiler sans le cloud :

```bash
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

L'APK sera dans : `android/app/build/outputs/apk/release/app-release.apk`

> Il faut alors Java 17 + le SDK Android installés sur la machine.

---

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|---|---|---|
| Administrateur | `admin@travexglobal.com` | `Admin123!` |
| Compte vérifié (démo) | `demo@travexglobal.com` | `Demo1234!` |

L'inscription est aussi possible directement depuis l'onglet **« S'inscrire »** de la page de connexion.
