# 📱 TRAVEX GLOBAL — Compiler un APK : checklist complète

Guide pour produire un fichier **`.apk`** installable sur Android.

---

## 🅰️ Méthode 1 — CLOUD (EAS) : la plus simple ✅

**Ton PC a besoin :**
- [ ] **Node.js** 18 ou + → https://nodejs.org (choisis « LTS »)
- [ ] Un **compte Expo gratuit** → https://expo.dev (création en 30 s)
- [ ] Une connexion internet

**Commandes :**
```bash
cd travex-global
npm install
npm install -g eas-cli
eas login                      # s'ouvre dans le navigateur
eas init                       # lie le projet
eas build -p android --profile preview
```
➡️ Résultat : **lien de téléchargement `.apk`** (build sur les serveurs Expo).

**Points forts :** aucun Android Studio, aucune JDK, build rapide, compatible PC modeste.
**Config PC requise :** très faible (Node seulement).

---

## 🅱️ Méthode 2 — LOCAL sur ton PC

**Logiciels obligatoires :**

| Logiciel | Version | Lien | Note |
|---|---|---|---|
| Node.js | 18 LTS + | nodejs.org | exécute Expo/Metro |
| **JDK (Java)** | **17 (exactement)** | adoptium.net/temurin | Gradle l'exige |
| **Android Studio** | dernière | developer.android.com/studio | installe le SDK |

> ⚠️ **JDK 17, pas 11 ni 21.** Avec un autre JDK, Gradle échoue (« Unsupported class file major version »).

**Après installation d'Android Studio :**
- [ ] Dans le « SDK Manager », installe : **SDK Platform**, **Build-Tools**, **Platform-Tools**, **Android SDK**.
- [ ] Définis la variable d'environnement **`ANDROID_HOME`** :
      - Windows : `C:\Users\Toi\AppData\Local\Android\Sdk`
      - macOS/Linux : `~/Library/Android/sdk` ou `~/Android/Sdk`
- [ ] Accepte les licences : `sdkmanager --licenses`

**Spécifications PC :**
| Ressource | Minimum | Recommandé |
|---|---|---|
| RAM | 4 Go | **8–16 Go** |
| Disque libre | ~6 Go | **15 Go+** |
| Processeur | quelconque | multi-cœurs |

**Commandes (build local) :**
```bash
cd travex-global
npm install
npx expo prebuild                # crée le dossier android/
cd android
./gradlew assembleRelease        # Windows : gradlew.bat assembleRelease
```
L'APK est dans : `android/app/build/outputs/apk/release/app-release.apk`

*(Pour signer l'APK « release » et pouvoir l'installer partout, il faut un fichier **keystore** et configurer `android/app/build.gradle` avec `signingConfigs`. L'APK « debug » `assembleDebug` s'installe sans keystore personnalisé : idéal pour tester.)*

---

## ⚙️ Installation de la JDK 17 (rapide)

**Windows / macOS / Linux :**
1. Va sur https://adoptium.net/temurin/releases
2. Télécharge **JDK 17** (LTS) pour ton OS et ton architecture (x64 / arm64).
3. Installe-le. Sur **macOS/Linux** :
   ```bash
   sudo update-alternatives --config java   # choisir la JDK 17
   java -version                            # doit afficher 17.x
   ```

---

## ❓ Lequel choisir ?

| Critère | CLOUD (EAS) | LOCAL |
|---|---|---|
| Temps de préparation | ~2 min | ~30–45 min (installations) |
| Config PC | Node seulement | JDK17 + Android Studio + 8 Go RAM |
| APK installable pour test | ✅ oui (signé Expo) | ✅ debug oui / release nécessite keystore |
| Pour publier Play Store | ✅ | ✅ |

👉 **Pour tester et installer aujourd'hui : Méthode 1 (cloud).** La méthode 2 (locale) est utile si tu veux être autonome et hors-ligne, mais elle te demande d'abord d'installer Android Studio + JDK 17.

---

## ✅ Vérification rapide de ton PC (Windows/macOS/Linux)

```bash
node -v      # doit afficher un numéro >= 18
java -version # doit afficher 17.x (pour la méthode locale)
echo $ANDROID_HOME  # doit afficher le chemin du SDK (méthode locale)
```
