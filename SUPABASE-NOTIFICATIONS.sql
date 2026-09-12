-- ===========================================================================
--  TRAVEX GLOBAL — Diffusion des publications + notifications push
-- ===========================================================================
--  À exécuter dans Supabase → SQL Editor, APRÈS la table `trips` du README.
--
--  Règle produit implémentée côté app (src/services/supabase.js) :
--    chaque publication (départ ou demande) est notifiée à TOUS les comptes
--    dont la CNI est validée (verified = true), à l'exception de son auteur.
--
--  En mode démo, `broadcastNewListing()` écrit dans le stockage local avec la
--  même forme que la table `notifications` ci-dessous : le passage au cloud ne
--  change pas la logique, seulement la destination.
-- ===========================================================================

-- 1. Profils — source de vérité du statut de vérification CNI ---------------
create table if not exists profiles (
  id                   uuid primary key references auth.users on delete cascade,
  email                text unique not null,
  full_name            text,
  role                 text default 'sender',        -- 'sender' | 'traveler' | 'admin'
  verified             boolean default false,        -- CNI validée par un administrateur
  verification_pending boolean default false,
  updated_at           timestamptz default now()
);

alter table profiles enable row level security;

create policy "profil lisible par tous"
  on profiles for select using (true);

create policy "profil modifiable par son propriétaire"
  on profiles for update using (auth.uid() = id);

-- Seul un administrateur peut valider une CNI.
create policy "validation CNI réservée au service"
  on profiles for update using (auth.role() = 'service_role');


-- 2. Notifications in-app — une ligne par destinataire ----------------------
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  recipient  uuid not null references profiles(id) on delete cascade,
  type       text not null default 'info',   -- 'newListing' | 'booking' | 'transit' | 'shipment' | 'status' | 'message'
  icon       text default 'notifications',
  title_fr   text not null,
  title_en   text not null,
  body_fr    text,
  body_en    text,
  read       boolean default false,
  created_at timestamptz default now()
);

alter table notifications enable row level security;

create policy "chacun lit ses propres notifications"
  on notifications for select using (auth.uid() = recipient);

create policy "chacun marque ses notifications comme lues"
  on notifications for update using (auth.uid() = recipient);

-- Pas de policy d'insert publique : seule la diffusion côté service écrit
-- (empêche un utilisateur de s'envoyer de fausses notifications).


-- 3. Jetons push Expo — un compte peut avoir plusieurs appareils ------------
create table if not exists push_tokens (
  id         uuid primary key default gen_random_uuid(),
  owner      uuid not null references profiles(id) on delete cascade,
  token      text not null,                  -- ExponentPushToken[...]
  platform   text not null default 'android',-- 'android' (FCM) | 'ios' (APNs)
  created_at timestamptz default now(),
  unique (owner, token)
);

alter table push_tokens enable row level security;

create policy "chacun gère ses propres jetons"
  on push_tokens for all
  using (auth.uid() = owner) with check (auth.uid() = owner);


-- 4. Index ------------------------------------------------------------------
create index if not exists notifications_recipient_idx
  on notifications (recipient, created_at desc);
create index if not exists push_tokens_owner_idx on push_tokens (owner);


-- 5. Diffusion d'une publication à tous les comptes vérifiés ---------------
--    À appeler depuis le backend (ou une Edge Function) après l'insert dans
--    `trips`. Renvoie le nombre de destinataires touchés — l'équivalent exact
--    du `broadcastCount` retourné par createTrip() en mode démo.
create or replace function notify_verified_new_listing(
  p_trip_id     uuid,
  p_author      uuid,
  p_is_demande  boolean,
  p_from        text,
  p_to          text,
  p_author_name text,
  p_detail      text
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  insert into notifications (recipient, type, icon, title_fr, title_en, body_fr, body_en)
  select
    p.id,
    'newListing',
    'megaphone',
    case when p_is_demande then 'Nouvelle demande de colis 📢' else 'Nouveau départ publié 📢' end,
    case when p_is_demande then 'New parcel request 📢'        else 'New departure published 📢' end,
    coalesce(p_author_name, 'Un membre vérifié') || ' · ' || p_from || ' → ' || p_to
      || coalesce(' · ' || p_detail, ''),
    coalesce(p_author_name, 'A verified member') || ' · ' || p_from || ' → ' || p_to
      || coalesce(' · ' || p_detail, '')
  from profiles p
  where p.verified = true                                   -- CNI validée uniquement
    and (p_author is null or p.id <> p_author);             -- auteur exclu

  get diagnostics n = row_count;
  return n;
end;
$$;

revoke execute on function notify_verified_new_listing(uuid, uuid, boolean, text, text, text, text) from public;
grant  execute on function notify_verified_new_listing(uuid, uuid, boolean, text, text, text, text) to service_role;


-- 6. (Option) Déclencheur : diffusion automatique à chaque publication -----
--    Décommentez si vous préférez laisser la base diffuser toute seule,
--    plutôt que d'appeler la fonction depuis le backend.
--
-- create or replace function trg_notify_new_listing() returns trigger
-- language plpgsql security definer set search_path = public as $$
-- begin
--   perform notify_verified_new_listing(
--     new.id, new.user_id, coalesce(new.is_demande, false),
--     new.from_city, new.to_city,
--     (select full_name from profiles where id = new.user_id),
--     new.transport
--   );
--   return new;
-- end;
-- $$;
--
-- create trigger notify_on_new_listing
--   after insert on trips
--   for each row execute function trg_notify_new_listing();
