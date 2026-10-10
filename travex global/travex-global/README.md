# TRAVEX GLOBAL — version 2

Une application simple : vous publiez les départs, les visiteurs les consultent
et réservent leur place en laissant leurs références. Pas de compte, pas de CNI.

## Parcours

**Visiteur**
1. Accueil : liste des départs disponibles, recherche par ville.
2. Détail d’un départ (date, transport, tarif, places restantes).
3. « Réserver » : prénom, nom, téléphone, e-mail (facultatif), ville, poids du colis.
4. Une référence `TG-XXXXXX` est donnée. Le visiteur la conserve.

**Administrateur** (bouton « Admin » en haut de l’accueil)
- **Publier** : ville de départ/arrivée, dates, transport, tarif par kg, capacité.
- **Départs** : fermer / rouvrir / supprimer un départ.
- **Réservations** : confirmer, annuler ou remettre en attente chaque réservation.

## Lancer l’application

```bash
npm install
npx expo start --web --port 8081 --host lan
```

Connexion admin : voir `src/config.js` (`OWNER`).

## Configuration (`src/config.js`)

- `OWNER` : e-mail et mot de passe de l’espace administrateur.
- `CURRENCY` : devise affichée (actuellement `€`).
- `TRANSPORTS` : modes de transport proposés.

## Stockage

Les données sont stockées sur l’appareil (AsyncStorage) dans `src/services/store.js`.
Conséquence : les réservations faites depuis un autre téléphone n’apparaissent pas
chez l’administrateur tant qu’un backend partagé n’est pas branché.

## Ancienne version

L’ancienne version (comptes, vérification CNI, messagerie, profils…) est conservée
dans le dossier `archive-v1/`.

## Tests

La logique métier (places, réservations, statuts, validations) a été vérifiée
avec un test isolé. L’interface n’a pas encore été testée pas à pas dans l’aperçu.
