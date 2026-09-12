-- =============================================================================
--  TRAVEX GLOBAL — Identité : les 3 photos de la CNI (recto, verso, selfie)
--  À exécuter dans Supabase → SQL Editor.
--
--  Règle produit : AUCUN numéro de CNI n'est collecté. L'identité se prouve par
--  3 images : CNI recto, CNI verso, et la personne tenant sa CNI en main.
--  Ces images doivent être VISIBLES et TÉLÉCHARGEABLES depuis l'espace admin.
--
--  Côté app (mode démo) : les 3 documents sont stockés en base64 dans
--  AsyncStorage (`cniFront`, `cniBack`, `cniSelfie`) et lus par
--  `getCniDocs(user)` (src/services/supabase.js) puis affichés/téléchargés par
--  `CniDocsView` (src/components/CniDocsView.js) + `downloadDocument`
--  (src/services/documents.js). En mode cloud, remplacez les data URI par les
--  URL publiques/privées renvoyées par Storage (mêmes noms de champs).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Trois colonnes « document » sur le profil (pas de colonne « numéro »)
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists cni_front   text,
  add column if not exists cni_back    text,
  add column if not exists cni_selfie  text,
  add column if not exists cni_submitted_at timestamptz default now();

-- Nettoyage : si un ancien schéma stockait un numéro de CNI, on le supprime.
-- (Décommentez seulement si la colonne existe encore dans votre projet.)
-- alter table public.profiles drop column if exists cni_number;
-- alter table public.profiles drop column if exists cni_photo;

comment on column public.profiles.cni_front  is 'Photo du RECTO de la CNI (URL Storage ou data URI).';
comment on column public.profiles.cni_back   is 'Photo du VERSO de la CNI.';
comment on column public.profiles.cni_selfie is 'Photo de la personne tenant sa CNI en main.';

-- -----------------------------------------------------------------------------
-- 2. Historique des dépôts (un document = une ligne) — utile pour l'audit admin
-- -----------------------------------------------------------------------------
create table if not exists public.identity_documents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        text not null check (kind in ('front', 'back', 'selfie')),
  storage_path text,               -- ex. cni-documents/<user_id>/front.jpg
  mime_type   text default 'image/jpeg',
  uploaded_at timestamptz default now(),
  unique (user_id, kind)
);

alter table public.identity_documents enable row level security;

-- L'utilisateur ne voit que SES documents.
create policy "identity_docs_own_select" on public.identity_documents
  for select using (auth.uid() = user_id);

-- L'utilisateur peut déposer / remplacer ses 3 documents.
create policy "identity_docs_own_insert" on public.identity_documents
  for insert with check (auth.uid() = user_id);

create policy "identity_docs_own_update" on public.identity_documents
  for update using (auth.uid() = user_id);

-- Les administrateurs (app_metadata.role = 'admin') lisent et téléchargent tout.
create policy "identity_docs_admin_select" on public.identity_documents
  for select using (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  );

-- -----------------------------------------------------------------------------
-- 3. Bucket Storage privé « cni-documents »
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('cni-documents', 'cni-documents', false)
on conflict (id) do update set public = false;

-- Dépôt : chacun dans SON dossier, images uniquement, 10 Mo max.
create policy "cni_upload_own" on storage.objects
  for insert with check (
    bucket_id = 'cni-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
    and storage.extension(name) in ('jpg', 'jpeg', 'png', 'webp')
    and (storage.metadata(name) ->> 'size')::int < 10485760
  );

-- Lecture / téléchargement : le propriétaire…
create policy "cni_read_own" on storage.objects
  for select using (
    bucket_id = 'cni-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- …et les administrateurs (visualisation + bouton « Télécharger » de l'app).
create policy "cni_read_admin" on storage.objects
  for select using (
    bucket_id = 'cni-documents'
    and coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  );

-- Remplacement / suppression par le propriétaire.
create policy "cni_update_own" on storage.objects
  for update using (
    bucket_id = 'cni-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "cni_delete_own" on storage.objects
  for delete using (
    bucket_id = 'cni-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- -----------------------------------------------------------------------------
-- 4. Vue « file de vérification » pour l'espace admin
--    (3 documents par profil, aucun numéro)
-- -----------------------------------------------------------------------------
create or replace view public.admin_identity_queue as
select
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.phone,
  p.location,
  p.cni_front,
  p.cni_back,
  p.cni_selfie,
  (p.cni_front is not null and p.cni_back is not null and p.cni_selfie is not null) as documents_complets,
  p.verified,
  p.cni_submitted_at
from public.profiles p
where p.verified = false
order by p.cni_submitted_at asc nulls last;

-- -----------------------------------------------------------------------------
-- 5. Contrôle : aucun numéro de CNI ne doit subsister
-- -----------------------------------------------------------------------------
select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and column_name ilike '%cni%number%';
-- Résultat attendu : 0 ligne.
