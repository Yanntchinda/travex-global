# 📲 Installer TRAVEX GLOBAL sur un VRAI iPhone

> **La contrainte Apple, sans détour :** Apple n'autorise pas le « sideloading ».
> Un `.ipa` ne s'installe sur un iPhone physique que s'il est signé avec un
> certificat **lié à un compte Apple Developer payant (99 $/an)**, ou compilé
> depuis **Xcode sur un Mac** avec un Apple ID gratuit (valable 7 jours).
> Il n'existe pas de troisième voie — ni via EAS, ni via un lien web.

| Voie | Coût | Mac requis ? | Validité | Combien d'appareils |
|---|---|---|---|---|
| **A. Ad hoc via EAS** (recommandée) | 99 $/an | ❌ Non | 1 an | 100 iPhone/an (UDID à enregistrer) |
| **B. TestFlight via EAS** | 99 $/an | ❌ Non | 90 j par build | 100 testeurs internes, 10 000 externes |
| **C. Xcode + Apple ID gratuit** | 0 € | ✅ **Oui** | **7 jours** | 1 appareil, non partageable, pas de push |

---

## Voie A — Ad hoc via EAS (pas de Mac, compte Apple payant)

Le profil `preview` de `eas.json` convient déjà pour iOS : `"distribution": "internal"`
(la clé `android.buildType: apk` ne concerne qu'Android). **Rien à modifier.**

### 1. Une seule fois : le compte Apple Developer

1. https://developer.apple.com/programs/ → **Enroll** (99 $/an, Apple ID + carte).
2. Attendez l'activation (de quelques minutes à 48 h).

### 2. Enregistrer votre iPhone

```bash
npm install -g eas-cli     # une seule fois
eas login                  # votre compte Expo (gratuit)
eas device:create
```

`eas device:create` affiche une **URL / un QR code** : ouvrez-le sur l'iPhone,
il récupère l'UDID automatiquement. (Sans cela : l'UDID se lit dans
*Finder/iTunes → cliquez sur le numéro de série*.)

> ⚠️ **Seuls les builds créés APRÈS l'enregistrement** s'installent sur cet
> appareil. Un appareil ajouté plus tard impose un nouveau build.

### 3. Builder

```bash
git fetch && git checkout arena/01a0966d-travex-global
npm install
eas build -p ios --profile preview
```

| Question du CLI | Réponse |
|---|---|
| `Would you like to log in to your Apple account?` | **Yes** — EAS crée le certificat de distribution et le profil ad hoc |
| Apple ID / mot de passe / code 2FA | ceux de votre compte développeur |
| `Generate a new Apple Distribution Certificate?` | **Yes** (première fois) |
| `Would you like to submit this build?` | **No** |

### 4. Installer

EAS renvoie une **URL d'installation** (page de build sur https://expo.dev) :
ouvrez-la **dans Safari sur l'iPhone** → *Installer*. Le profil ad hoc vérifie
l'UDID : si l'appareil n'était pas enregistré avant le build, l'installation est
refusée.

---

## Voie B — TestFlight (le plus simple pour faire tester d'autres personnes)

```bash
eas build -p ios --profile production   # autoIncrement: true → n° de build géré par EAS
eas submit -p ios                       # envoie sur App Store Connect
```

Puis dans **App Store Connect** → TestFlight → ajoutez votre Apple ID comme
testeur interne (jusqu'à 100, sans validation Apple) et installez via l'app
TestFlight sur l'iPhone. Les testeurs externes (jusqu'à 10 000) exigent une
validation Beta App Review.

> C'est aussi la voie obligatoire pour publier ensuite sur l'App Store.

---

## Voie C — Gratuit, mais avec un Mac (7 jours seulement)

```bash
npm install
npx expo prebuild --platform ios        # génère le dossier ios/
open ios/*.xcworkspace                  # ouvre Xcode
```

Dans Xcode : *Settings → Accounts → +* → votre **Apple ID gratuit** →
*Manage Certificates → + → iOS Development*. Sélectionnez cette équipe dans
*Signing & Capabilities*, branchez l'iPhone en USB, choisissez-le comme
destination, puis **Run ▶**.

Limites : provisioning **valable 7 jours** (à refaire chaque semaine),
**un seul appareil** par identifiant de bundle, application **non partageable**,
et **pas de notifications push**.

---

## Ce que ça change pour les notifications push iOS

Les push iOS (APNs) exigent le compte payant dans tous les cas : la clé APNs se
génère dans App Store Connect. La procédure Android (FCM, gratuite) reste celle
décrite dans [`PUSH-NOTIFICATIONS.md`](PUSH-NOTIFICATIONS.md).

---

## Valeurs du projet (rien à changer)

| Champ | Où | Valeur |
|---|---|---|
| Bundle ID iOS | `app.json` → `ios.bundleIdentifier` | `com.travexglobal.app` |
| Version | `app.json` | `1.0.0` |
| Projet EAS | `app.json` → `extra.eas.projectId` | `773d6b4f-1108-4f46-aa07-34169d7ab8a0` |
| Profil ad hoc | `eas.json` | `preview` (`distribution: internal`) |
| Profil TestFlight | `eas.json` | `production` (`autoIncrement: true`) |

## Identifiants de test (mode démo)

| Élément | Valeur |
|---|---|
| Compte vérifié | `demo@travexglobal.com` / `Demo1234!` |
| Compte admin (voit les 3 photos de CNI, les télécharge) | `admin@travexglobal.com` / `Admin123!` |
