# 📦 TRAVEX GLOBAL

Application mobile de **transit de colis** : les gens publient leurs voyages/départs et les autres confient leurs colis & documents. Conçue sur le modèle de votre référence (Treliko), en **React Native + Expo (SDK 57)**.

> Appli **Android + iOS** en un seul code. Testez-la en quelques minutes, puis compilez un **APK pour Android** et un **build iOS (TestFlight)**.

---

## ✅ Tester tout de suite (sans rien installer sur PC ? si, mais simple)

Prérequis : [Node.js 18+](https://nodejs.org) installé sur votre ordinateur.

```bash
cd travex-global
npm install
npx expo start
```

- Un **QR code** s'affiche (et une URL `exp://192.168.x.x:8081`).
- Sur votre téléphone, installez **Expo Go** (App Store / Play Store), puis **scannez le QR code**.
- L'app s'ouvre immédiatement sur votre mobile — **Android & iOS**.

> 💡 Téléphone et PC doivent être sur le **même Wi-Fi**.

---

## 📱 Compiler un APK installable (Android — test réel hors Expo Go)

Pour tester l'app **installée** (et pouvoir la distribuer à d'autres), on compile un APK avec EAS Build. C'est gratuit et se fait dans le cloud — pas besoin de Studio Android.

```bash
npm install -g eas-cli
eas login                          # créez un compte http://expo.dev (gratuit)
eas init                           # lie le projet à votre compte Expo
eas build -p android --profile preview    # -> génère un APK
```

Quand le build est terminé, un **lien de téléchargement APK** vous est donné. Installez-le sur votre Android (autorisez « sources inconnues »).

---

## 🍏 Build iOS (iPhone — TestFlight)

```bash
eas build -p ios --profile preview
```

Expo build iOS **gratuitement via ce flux** (simulateur) ou vous fournit un build pour **TestFlight**. Pour signer sur un vrai iPhone il faut un **compte développeur Apple** (99 $/an) et renseigner vos clés dans les réglages Expo/EAS.

---

## 🏪 Publication Play Store & App Store

```bash
eas build -p android --profile production
eas build -p ios --profile production
eas submit -p android            # pousse vers Play Console
eas submit -p ios                # pousse vers App Store Connect
```

Rappels avant publication (Play Console / App Store Connect) :
- Remplir fiche boutique (description, captures, catégorie « Voyage / Transport »).
- Politique de confidentialité (lien obligatoire — Supabase en fournit un).
- Comptes développeurs Google Play (25 $ une fois) et Apple (99 $/an).

---

## 🗄️ Base de données GRATUITE (Supabase)

L'app fonctionne par défaut en **mode démo** (données fictives, aucun serveur). Pour la passer en **mode réel** (comptes, annonces persistées), on utilise **Supabase** : PostgreSQL hébergé **gratuit** (500 Mo), avec authentification, base et stockage. **Aucune carte bancaire.**

### 1. Créer le projet
1. Allez sur **[https://supabase.com](https://supabase.com)** → *New project* (gratuit).
2. Notez l'**URL** et la clé **`anon public`** (dans *Settings → API*).

### 2. Créer la table
Dans **SQL Editor**, collez et exécutez :

```sql
create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  from_city text not null,
  to_city text not null,
  from_date text,
  to_date text,
  transport text,
  price_kg numeric,
  price_article numeric,
  weight_kg numeric,
  created_at timestamptz default now()
);
alter table trips enable row level security;
create policy "public read" on trips for select using (true);
create policy "owner insert" on trips for insert with check (auth.uid() = user_id);
```

### 3. Brancher l'app
Ouvrez **`src/config.js`** et collez vos clés :

```js
export const SUPABASE_URL = 'https://XXXX.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJ...';
```

Relancez l'app : l'authentification et les annonces passent en mode réel. *(Le mode démo bascule automatiquement dès que les deux valeurs sont remplies.)*

---

## 👥 Types de comptes & règles de publication

À l'inscription, l'utilisateur **choisit obligatoirement** son profil :

| | ✈️ **Voyageur** (« Je suis un voyageur ») | 📦 **Demandeur** (« Je souhaite faire expédier un colis ») |
|---|---|---|
| Compte | **Obligatoire** pour publier un départ | **Aucun compte requis** pour publier une demande |
| Identification | **Références + CNI obligatoires** (photo recto + selfie avec CNI) | **Aucune pièce d'identité** demandée |
| Peut publier | Départs (trajets) **et** demandes | **Uniquement des demandes d'expédition** (annonces) |
| Vérification | Compte **vérifié par un administrateur** avant de pouvoir publier le moindre départ | Non applicable |

Règles appliquées dans l'app :

- **Sans compte** (invité) : on peut parcourir les annonces et publier des **demandes d'expédition** en laissant simplement nom + téléphone (elles apparaissent dans l'onglet *Annonces* de l'appareil).
- **Compte voyageur non vérifié** : il ne peut publier **aucun départ** tant qu'un administrateur n'a pas validé ses références + CNI (les demandes restent possibles).
- **Changer de statut** (espace Profil) : un demandeur qui souhaite publier des départs y saisit ses références et sa CNI ; son compte passe en « voyageur — vérification en cours » jusqu'à validation par l'administration.

---

## 🧭 Écrans inclus

- **Connexion** / **Finalisation d'inscription Google**
- **Accueil** : onglets *Voyages / Demande*, recherche par destination, cartes de voyage (itinéraire, tarifs, voyageur, bouton « Voir les détails »), bouton **+** pour publier.
- **Détails du voyage** : profil, informations, objets non transportés, avis important, menu (partager, masquer, signaler), boutons *Contacter / Réserver*.
- **Publier une annonce** : ville de départ/arrivée, date, transport, tarif, capacité.
- **Réservations** (clients / mes), **Mes annonces** (voyages / demandes), **Messages**.
- **Profil** : en-tête bleu, stats, vérification compte, menu complet.
- **Sous-écrans profil** : infos personnelles, **changer de statut** (demandeur → voyageur), gestion des paiements, notifications, sécurité (2FA), langue (FR/EN), évaluations, support.

---

## 🎨 Identité

- Couleur principale : `#1D5A9E` (bleu) · accent orange `#F0A020` · vert `#27A463` · rouge `#D9534F`.
- Modifier dans `src/theme/theme.js`.

---

## 🛠️ Structure

```
src/
  config.js            -> clés Supabase (base gratuite)
  theme/theme.js       -> couleurs, espacements, ombres
  data/mockData.js     -> données de démonstration
  services/supabase.js -> auth + données (démo/cloud)
  context/AuthContext.js
  components/          -> composants réutilisables
  screens/
    auth/            -> Connexion, Finalisation inscription
    home/            -> Accueil
    detail/          -> Détails du voyage
    publish/         -> Publier une annonce
    tabs/            -> Réservations, Annonces, Messages, Profil
    profile/         -> Infos perso, Paiements, Notifications,
                        Sécurité, Langue, Évaluations, Support
App.js                 -> navigation (pile + onglets)
eas.json               -> config builds (APK / iOS / production)
```

---

## ❓ Notes

- Le mode démo conserve les données **localement** sur l'appareil (AsyncStorage) : idéal pour tester sans internet.
- Certificat de signature Android/iOS et clés de compte développeur : à fournir personnellement lors de la publication officielle.
- Le logo/icône TRAVEX GLOBAL est génératif ; remplacez `assets/icon.png` par votre logo définitif si besoin.
