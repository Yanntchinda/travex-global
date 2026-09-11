# 🔄 Système de mise à jour de TRAVEX GLOBAL (OTA + Play Store)

> **OTA = « Over The Air »** : envoyer une mise à jour de l'application
> **directement sur les téléphones des utilisateurs**, sans repasser par le
> Play Store. C'est le système **EAS Update** d'Expo, déjà configuré dans ce
> projet. ✅

---

## Comment ça marche (en 30 secondes)

L'application contient 2 parties :

| Partie | Contenu | Peut être mis à jour par OTA ? |
|---|---|---|
| **Code JS + images** | Écrans, textes, couleurs, logos, logique | ✅ Oui — instantané, sans Google |
| **Partie native** | Permissions (caméra, photos...), nouveaux modules natifs, icône, nom, version | ❌ Non — il faut une nouvelle build Play Store |

**Règle simple :** si vous avez changé des **écrans, textes, couleurs ou
images** → OTA suffit. Si vous avez ajouté une **permission, changé l'icône
ou le nom de l'app** → nouvelle version sur le Play Store.

---

## 1. Envoyer une mise à jour OTA (utilisateur déjà installé)

Après avoir modifié le code et commité :

```bash
npm run ota:publish -- --message "Description de la mise à jour"
# = eas update --branch production --message "..."
```

⚡ **Effet :** la prochaine fois que les utilisateurs **ouvrent l'app**, elle
télécharge silencieusement la nouvelle version et la recharge
(vérification au démarrage, déjà codée dans `App.js` → `OtaUpdater`).
Aucune action de leur part, aucune validation Google.

Pour tester avant d'envoyer à tout le monde :

```bash
npm run ota:preview -- --message "Test"   # branche preview (builds de test)
```

## 2. Publier une vraie nouvelle version (Play Store)

Quand la mise à jour touche du natif (permissions, icône, version) :

```bash
# 1. incrémenter "version" dans app.json (ex: 1.0.0 → 1.0.1)
npm run build:aab            # build de production (EAS)
# 2. télécharger l'.aab puis le déposer sur le Play Store Console
#    (ou : eas submit -p android si configuré)
```

⚠️ **Lien entre les deux :** `runtimeVersion` est réglé sur la **version de
l'app** (`appVersion`). Les mises à jour OTA ne s'appliquent qu'aux
installations de **la même version**. Donc :

- version **1.0.0** installée → OTA reçus pour 1.0.0 ✅
- vous publiez **1.0.1** sur le Play Store → il faut envoyer les OTA
  suivants après un build 1.0.1 (sinon les vieux installs ne les voient pas).

---

## 3. Ce qui est déjà configuré dans ce projet

| Fichier | Rôle |
|---|---|
| `app.json` → `updates.url` | Pointe vers le projet EAS (`u.expo.dev/773d6b4f-...`) |
| `app.json` → `runtimeVersion` | Politique `appVersion` (cf. ⚠️ ci-dessus) |
| `app.json` → `checkAutomatically: ON_LOAD` | Vérification à chaque ouverture |
| `App.js` → `OtaUpdater` | Télécharge + recharge la mise à jour au démarrage (mobile uniquement, silencieux) |
| `eas.json` → `channel` | `production` (utilisateurs finaux) / `preview` (tests) |
| `package.json` | Scripts `ota:publish` et `ota:preview` |

## 4. Résumé pour bien démarrer

```bash
npm install -g eas-cli && eas login     # une seule fois
npm run build:aab                       # 1re version Play Store
# ... plus tard, petit changement de texte/couleur/écran ...
npm run ota:publish -- --message "Correction écran réservations"
# → tous les utilisateurs reçoivent la mise à jour à la prochaine ouverture 🎉
```
