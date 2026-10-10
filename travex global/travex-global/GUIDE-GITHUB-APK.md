# 📦 TRAVEX GLOBAL — Obtenir l'APK via GitHub + EAS (100 % navigateur)

> Aucune commande terminal. Tout se fait en cliquant, sur les sites GitHub et Expo.

---

## ÉTAPE 1 — Créer le dépôt GitHub

1. Va sur **https://github.com/new** (connecte-toi ou crée un compte gratuit).
2. **Repository name** : `travex-global`
3. **Private** (recommandé) — ou Public, peu importe.
4. ⚠️ **NE coche PAS** « Add a README file » (le dépôt doit rester vide).
5. Clique **« Create repository »**.

---

## ÉTAPE 2 — Uploade ton code (glisser-déposer)

1. Sur la page du dépôt, clique sur **« Uploading an existing file »** (ou *Add file → Upload files*).
2. Ouvre ton dossier **`travex-global`** (celui décompressé sur ton Bureau).
3. **Sélectionne tout le contenu de CE dossier** (pas le dossier lui-même) :
   - `src/`, `assets/`, `App.js`, `app.json`, `eas.json`, `index.js`, `package.json`, `README.md`, `build-apk.bat`, etc.
   - ⚠️ **N'INCLUS PAS** : `node_modules/`, `.git/`, `.expo/`, `.claude/`. *(Grands ou inutiles — EAS les gère seul.)*
4. Glisse cette sélection dans la zone de téléversement de GitHub.
5. Vérifie que tu vois bien **`app.json` et `package.json` à la RACINE** (pas dans un sous-dossier `travex-global`).
6. Clique **« Commit changes »** en bas.

---

## ÉTAPE 3 — Connecte le dépôt à ton projet Expo

1. Va sur **https://expo.dev/accounts/nemesisprime/projects/travex-global**
2. Menu **Settings** (⚙️) → section **« Git repository »** (ou onglet **Builds → « Connect a Git repository »**).
3. Clique **« Connect »** → autorise l'accès GitHub (connexion OAuth, accepte les permissions).
4. **Sélectionne** le dépôt `travex-global` créé à l'étape 1.

> ✅ Le projet Expo est **déjà lié** à ton compte (projectId dans app.json). Si Expo demande de confirmer le dépôt, accepte.

---

## ÉTAPE 4 — Lance le build depuis le web

1. Dans ton projet Expo, onglet **Builds**.
2. Clique **« New build »** (ou « Create your first build »).
3. Platforme : **Android**.
4. **Build profile** : **Preview** (celui qui génère un `.apk` installable).
5. Clique **« Build »**.

---

## ÉTAPE 5 — Récupère ton APK

1. Le build prend **~5 à 10 minutes** (tu vois l'avancement sur la page Builds).
2. Quand il passe à **« Finished »**, tu as un bouton **télécharger l'APK** (`.apk`).
3. Télécharge-le → envoie-le sur ton téléphone (WhatsApp / câble / cloud) → ouvre-le → **Installer**.

---

## 🛠️ En cas de blocage

| Problème | Ce que tu fais |
|---|---|
| Le bouton « New build » te renvoie vers une ligne de commande | C'est le cas le plus fréquent. Dis-le-moi : je te donne LA seule petite commande à taper (on ne peut pas l'éviter dans ce cas, mais on est déjà presque au but). |
| Le dépôt GitHub n'apparaît pas dans la liste | Vérifie que le repo est bien **créé** sur GitHub (Étape 1) et que tu es connecté au bon compte GitHub. |
| Erreur pendant le build | **Capture / copie le message** et envoie-le-moi ici. |
