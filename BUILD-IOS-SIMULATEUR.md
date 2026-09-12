# 📱 Build iOS SIMULATEUR — Tester TRAVEX GLOBAL SANS certificat Apple

> **Objectif :** installer et tester l'application sur un **simulateur iOS**
> **avant** de payer le compte développeur Apple (99 €/an).
>
> ⚠️ **Important :** le simulateur ne nécessite **aucun certificat ni profil de
> provisionnement**. Ce n'est qu'au moment de tester sur un **vrai iPhone** ou de
> publier sur l'App Store que le compte payant devient nécessaire.

> 🖥️ **Prérequis matériel — à lire avant de builder :**
> - **Construire** le build iOS simulateur : possible depuis **n'importe quel OS**
>   (Windows, Linux, macOS) — la compilation se fait sur les serveurs d'Expo.
> - **Installer et lancer** ce build : **un Mac avec Xcode est obligatoire**.
>   Le simulateur iOS n'existe que sur macOS ; il est fourni par Xcode.
>   Sur Windows ou Linux, le fichier `.app` produit ne peut être ni installé ni lancé.
>
> Sans Mac, la voie de test réelle est l'**APK Android** (`npm run build:apk`).

---

## Option A — EAS Build dans le cloud (recommandée) ☁️

Le build tourne sur les serveurs d'Expo (donc **pas besoin de Mac pour le
compiler**), puis vous récupérez un fichier `.app` à glisser dans le simulateur.
**Aucun certificat Apple requis.**

> Le `.app` ne s'installe que sur un **Mac** (Xcode + Simulator). Lancer le build
> depuis Windows ne sert à rien si vous n'avez pas accès à un Mac ensuite.

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

### Variante : depuis la page web « Build from GitHub » (expo.dev)

Sans terminal, sur https://expo.dev → votre projet → **Builds** →
**Build from GitHub** :

| Champ | Valeur |
|---|---|
| GitHub repository | `Yanntchinda/travex-global` |
| Base directory | **vide** |
| Platform | **iOS** |
| Git ref | **`arena/01a0966d-travex-global`** (⚠️ pas `main` : cette branche ne contient pas le code actuel) |
| EAS Build profile | **`preview-ios`** |
| EAS Submit | désactivé |

> ⚠️ La page affiche un bandeau « Configure credentials before building » dès que
> la plateforme iOS est choisie. Pour un profil **simulateur**, aucune donnée
> Apple n'est exigée (EAS répond littéralement *« A simulator distribution does
> not require credentials to be configured »*). Je n'ai pas pu vérifier le
> comportement de cette page web depuis cet environnement : si elle refuse de
> lancer le build, passez par le terminal (`npm run build:ios-sim`), où
> l'absence d'identifiants Apple est documentée et effective.

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
| Colis démo « en cours » (onglet KiloPass) | `GP-7408` — PIN de livraison `2915` |
| Colis démo expéditeur | `GP-8921` — son PIN s'affiche sur la carte (`5730`) |

Le suivi d'un colis ne compte plus que **3 étapes** : *En attente* → *En cours*
(prise en charge par le voyageur, PIN généré) → *Livré* (remise contre PIN).
L'étape « Vol atterri » a été supprimée.

---

## 📋 Fiche de build — exactement quoi saisir

### Une seule fois (compte Expo gratuit — jamais de compte Apple)

| Étape | Commande | Ce que vous saisissez |
|---|---|---|
| Installer le CLI | `npm install -g eas-cli` | rien |
| Se connecter | `eas login` | **e-mail** + **mot de passe** de votre compte https://expo.dev (création gratuite). Aucun Apple ID, aucune carte bancaire. |
| Lier le projet | `eas init` | accepter le `projectId` déjà présent : `773d6b4f-1108-4f46-aa07-34169d7ab8a0`. Si EAS indique que ce projet n'est pas sur **votre** compte : relancez `eas init`, choisissez **« Create a new project »** et donnez le slug `travex-global`. |

### Build iOS SIMULATEUR (le build « démo » sans compte Apple)

```bash
npm run build:ios-sim     # = eas build -p ios --profile preview-ios
```

| Question du CLI | Réponse |
|---|---|
| Identifiants Apple / certificat / provisioning | **aucune question** : le profil `preview-ios` contient `"simulator": true`, EAS ne demande rien à Apple. |
| `Would you like to submit this build…?` | `No` (vous installez le `.app` vous-même dans le simulateur). |

### Build Android APK (aucun compte Apple non plus)

```bash
npm run build:apk         # = eas build -p android --profile preview
```

| Question du CLI | Réponse |
|---|---|
| `Generate a new Android Keystore?` | **Yes** (EAS crée et conserve la clé de signature). |
| `Would you like to submit this build…?` | `No` |

### Valeurs déjà en place (rien à changer pour la démo)

| Champ | Où | Valeur |
|---|---|---|
| Nom de l'app | `app.json` | `TRAVEX GLOBAL` |
| Slug | `app.json` | `travex-global` |
| Version | `app.json` | `1.0.0` |
| Bundle ID iOS | `app.json` → `ios.bundleIdentifier` | `com.travexglobal.app` |
| Package Android | `app.json` → `android.package` | `com.travexglobal.app` |
| Projet EAS | `app.json` → `extra.eas.projectId` | `773d6b4f-1108-4f46-aa07-34169d7ab8a0` |
| Profil simulateur | `eas.json` | `preview-ios` (`ios.simulator: true`) |
| Profil APK | `eas.json` | `preview` (`android.buildType: apk`) |

> `eas.json` utilise `appVersionSource: "remote"` : les numéros de build viennent
> des serveurs d'Expo (parfait pour le cloud). Si vous voulez un jour compiler
> hors ligne (`eas build --local`), passez cette valeur à `"local"`.

---

## ✅ Quand payer Apple ?

| Étape | Compte payant Apple (99 €/an) |
|---|---|
| Simulateur iOS | ❌ Compte payant non nécessaire — **mais un Mac avec Xcode est obligatoire** |
| iPhone réel (via TestFlight ou câble) | ✅ Oui |
| Publication App Store | ✅ Oui |

Le jour venu : `eas submit -p ios` s'occupe de tout avec vos identifiants
App Store Connect.
