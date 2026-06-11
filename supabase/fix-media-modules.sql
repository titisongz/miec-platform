-- ============================================================================
-- MEDIA & MODULES — colonnes photos + Storage + corrections
-- À exécuter dans Supabase → SQL Editor (une seule fois). Idempotent.
--
-- Tant que ce script n'est pas exécuté :
--   • les modules fonctionnent SANS photo (le code n'envoie les colonnes média
--     que lorsqu'une valeur est présente) ;
--   • l'upload de photos / la création de ressources avec description / d'un
--     cours IPB avec niveau échoueront (colonnes manquantes).
-- ============================================================================

-- ── 1. Bucket de stockage des images ────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

-- Lecture publique, écriture réservée aux utilisateurs connectés.
drop policy if exists "media: lecture publique"       on storage.objects;
drop policy if exists "media: upload authentifié"     on storage.objects;
drop policy if exists "media: maj authentifié"        on storage.objects;
drop policy if exists "media: suppression authentifié" on storage.objects;

create policy "media: lecture publique"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "media: upload authentifié"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media');

create policy "media: maj authentifié"
  on storage.objects for update to authenticated
  using (bucket_id = 'media');

create policy "media: suppression authentifié"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media');

-- ── 2. Colonnes média / manquantes ──────────────────────────────────────────
alter table public.sorties    add column if not exists photos text[] default '{}';
alter table public.annonces   add column if not exists photos text[] default '{}';
alter table public.ressources add column if not exists description text;
alter table public.ressources add column if not exists photo_url   text;
alter table public.livres     add column if not exists couverture_url text;

-- IPB : alignement front ↔ formulaire (le front affiche modules ; le formulaire
-- collecte niveau + description, qui n'existaient pas dans ipb_cours).
alter table public.ipb_cours  add column if not exists niveau      text;
alter table public.ipb_cours  add column if not exists description text;

-- ── 3. Enum type_ressource : ajouter 'video' (présent dans le formulaire) ────
-- (ALTER TYPE ADD VALUE ne peut pas tourner dans une transaction → standalone)
alter type type_ressource add value if not exists 'video';

-- ============================================================================
-- Vérification (optionnel) :
--   select column_name from information_schema.columns
--   where table_schema='public' and table_name='sorties';
--   select * from storage.buckets where id='media';
-- ============================================================================
