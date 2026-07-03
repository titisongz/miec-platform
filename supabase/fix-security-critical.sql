-- ============================================================================
-- FIX SÉCURITÉ CRITIQUE — 3 failles identifiées lors de l'audit du 2026-07-03
-- À exécuter dans Supabase → SQL Editor (une seule fois). Idempotent.
--
--   1. Escalade de rôle : un membre pouvait modifier son propre `role` /
--      `etudiant_ipb` via l'API REST (policy UPDATE sans WITH CHECK).
--   2. Fan-out de notifications (notifier_tous / notifier_responsables /
--      notifier_membre) exécutables par des visiteurs anonymes (grant `anon`).
--   3. Bucket Storage « media » : upload/maj/suppression ouverts à tout
--      utilisateur connecté au lieu des seuls responsables/super_admin.
--
-- Prérequis (Action 0) : la table public.notifications, dont dépend
-- l'Action 2, est recréée en `if not exists` — supabase/fix-notifications.sql
-- s'est avéré ne pas avoir été appliqué tel quel sur cette base.
--
-- DIAGNOSTIC — à lancer AVANT le script pour voir les signatures réellement
-- déployées (utile si ce script échoue de nouveau avec "function ... does
-- not exist" — l'Action 2 ci-dessous ne dépend plus de ce résultat, elle
-- supprime dynamiquement toutes les variantes existantes, mais cette requête
-- reste utile pour comprendre l'état de la base avant intervention) :
--
--   select p.proname, pg_get_function_arguments(p.oid) as arguments
--   from pg_proc p
--   join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public'
--     and p.proname in ('notifier_tous', 'notifier_responsables', 'notifier_membre');
-- ============================================================================

begin;

-- ────────────────────────────────────────────────────────────────────────────
-- ACTION 0 — Prérequis : table `notifications`
-- ────────────────────────────────────────────────────────────────────────────
-- La 2e tentative de ce script a échoué avec « relation "public.notifications"
-- does not exist » : supabase/fix-notifications.sql, qui est censé créer
-- cette table, n'a en réalité jamais été appliqué sur cette base (ou l'a été
-- différemment). Les fonctions notifier_* de l'Action 2 en dépendent — on la
-- (re)crée donc ici avant tout, en `if not exists` pour rester sans danger
-- si elle existe déjà. Définition identique à supabase/fix-notifications.sql.

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  type        text not null,
  titre       text not null,
  message     text not null,
  lien        text,
  lu          boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_notifications_profile
  on public.notifications(profile_id, created_at desc);
create index if not exists idx_notifications_unread
  on public.notifications(profile_id) where lu = false;

alter table public.notifications enable row level security;

drop policy if exists "notifications: lecture proprio" on public.notifications;
create policy "notifications: lecture proprio"
  on public.notifications for select
  using (profile_id = auth.uid());

drop policy if exists "notifications: maj proprio" on public.notifications;
create policy "notifications: maj proprio"
  on public.notifications for update
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

drop policy if exists "notifications: suppression proprio" on public.notifications;
create policy "notifications: suppression proprio"
  on public.notifications for delete
  using (profile_id = auth.uid());

drop policy if exists "notifications: insert authentifié" on public.notifications;
create policy "notifications: insert authentifié"
  on public.notifications for insert to authenticated
  with check (true);


-- ────────────────────────────────────────────────────────────────────────────
-- ACTION 1 — profiles : fin de l'auto-escalade de rôle
-- ────────────────────────────────────────────────────────────────────────────
-- RLS seule ne peut pas protéger des colonnes précises sur un UPDATE sans
-- risquer une sous-requête auto-référentielle sur `profiles` (le projet a
-- déjà rencontré une récursion RLS sur cette table, cf. fix-rls-backoffice.sql).
-- On sépare donc les deux responsabilités :
--   • RLS  → QUI a le droit de tenter un UPDATE sur QUELLE ligne.
--   • TRIGGER (SECURITY DEFINER, donc hors RLS) → QUELLES colonnes un
--     utilisateur non privilégié a le droit de changer sur SA PROPRE ligne.

drop policy if exists "profiles: mise à jour proprio"      on public.profiles;
drop policy if exists "profiles: admin peut tout modifier" on public.profiles;
drop policy if exists "profiles: super_admin peut tout modifier" on public.profiles;

-- Un membre peut mettre à jour sa propre ligne (nom, téléphone, préférences
-- de notification…). Le trigger ci-dessous bloque toute tentative de
-- modifier `role` ou `etudiant_ipb` depuis cette policy.
create policy "profiles: mise à jour proprio"
  on public.profiles for update
  using      (id = auth.uid())
  with check (id = auth.uid());

-- Seul un super_admin peut modifier la ligne d'un AUTRE utilisateur
-- (promotion/révocation de rôle, activation IPB, etc.).
create policy "profiles: super_admin peut tout modifier"
  on public.profiles for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
  );

-- Verrou colonne par colonne : `role` et `etudiant_ipb` ne peuvent changer
-- que si l'auteur de la requête (auth.uid()) est déjà privilégié. La
-- fonction est SECURITY DEFINER : sa lecture de `profiles` contourne la RLS,
-- donc aucun risque de récursion, quelle que soit la policy active plus haut.
create or replace function public.verrouiller_colonnes_sensibles_profiles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if not exists (
      select 1 from public.profiles where id = auth.uid() and role = 'super_admin'
    ) then
      raise exception 'Modification du rôle réservée aux super administrateurs';
    end if;
  end if;

  if new.etudiant_ipb is distinct from old.etudiant_ipb then
    if not exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('responsable', 'super_admin')
    ) then
      raise exception 'Modification du statut étudiant IPB réservée aux responsables';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_verrou_colonnes on public.profiles;
create trigger trg_profiles_verrou_colonnes
  before update on public.profiles
  for each row execute function public.verrouiller_colonnes_sensibles_profiles();


-- ────────────────────────────────────────────────────────────────────────────
-- ACTION 2 — Notifications : retrait de l'accès anonyme
-- ────────────────────────────────────────────────────────────────────────────
-- La signature réellement déployée sur ce projet ne correspond pas à celle
-- de supabase/fix-notifications.sql dans le repo (constaté : le premier
-- essai de ce script a échoué avec « function notifier_tous(text,text,
-- text,text) does not exist »). Un REVOKE/CREATE OR REPLACE qui suppose une
-- signature précise est donc fragile. On supprime plutôt TOUTES les
-- variantes existantes de ces 3 fonctions, quelle que soit leur signature
-- réelle, puis on les recrée proprement avec une signature unique et connue.

do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('notifier_tous', 'notifier_responsables', 'notifier_membre')
  loop
    execute format('drop function %s', r.sig);
  end loop;
end $$;

-- Diffusion à TOUS les membres — réservée à responsable/super_admin.
-- (Avant : n'importe quel membre pouvait broadcaster à toute la
-- communauté via cette fonction, ex. en soumettant une prière.)
create function public.notifier_tous(
  p_type text, p_titre text, p_message text, p_lien text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('responsable', 'super_admin')
  ) then
    raise exception 'Accès refusé : la diffusion à tous les membres est réservée aux responsables';
  end if;

  insert into public.notifications (profile_id, type, titre, message, lien)
  select p.id, p_type, p_titre, p_message, p_lien
  from public.profiles p
  where p.id is distinct from auth.uid();
end;
$$;

-- Diffusion aux responsables/super_admin — inchangée (logique identique à
-- supabase/fix-notifications.sql), juste recréée pour repartir d'une base
-- propre après le drop ci-dessus.
create function public.notifier_responsables(
  p_type text, p_titre text, p_message text, p_lien text
) returns void
language sql security definer set search_path = public as $$
  insert into public.notifications (profile_id, type, titre, message, lien)
  select p.id, p_type, p_titre, p_message, p_lien
  from public.profiles p
  where p.role in ('responsable', 'super_admin')
    and p.id is distinct from auth.uid();
$$;

-- Notification à UN destinataire précis — inchangée elle aussi.
create function public.notifier_membre(
  p_profile uuid, p_type text, p_titre text, p_message text, p_lien text
) returns void
language sql security definer set search_path = public as $$
  insert into public.notifications (profile_id, type, titre, message, lien)
  values (p_profile, p_type, p_titre, p_message, p_lien);
$$;

-- IMPORTANT : une fonction nouvellement créée accorde EXECUTE à PUBLIC par
-- défaut en PostgreSQL — et PUBLIC s'applique à `anon` comme à tout le
-- reste. Un simple `revoke ... from anon` sans toucher à PUBLIC laisse donc
-- la porte ouverte. On révoque PUBLIC explicitement avant de ne réaccorder
-- qu'à `authenticated`.
revoke execute on function public.notifier_tous(text, text, text, text)         from public;
revoke execute on function public.notifier_responsables(text, text, text, text) from public;
revoke execute on function public.notifier_membre(uuid, text, text, text, text) from public;

grant execute on function public.notifier_tous(text, text, text, text)         to authenticated;
grant execute on function public.notifier_responsables(text, text, text, text) to authenticated;
grant execute on function public.notifier_membre(uuid, text, text, text, text) to authenticated;


-- ────────────────────────────────────────────────────────────────────────────
-- ACTION 3 — Storage bucket "media" : écriture réservée aux responsables
-- ────────────────────────────────────────────────────────────────────────────
-- `storage.policies` n'est pas une table dans laquelle on DELETE directement :
-- les policies du bucket sont de vraies policies RLS sur `storage.objects`
-- (créées ainsi dans fix-media-modules.sql) et se suppriment avec DROP POLICY.

drop policy if exists "media: lecture publique"        on storage.objects;
drop policy if exists "media: upload authentifié"      on storage.objects;
drop policy if exists "media: maj authentifié"         on storage.objects;
drop policy if exists "media: suppression authentifié" on storage.objects;
drop policy if exists "media: upload responsable"       on storage.objects;
drop policy if exists "media: modification responsable" on storage.objects;
drop policy if exists "media: suppression responsable"  on storage.objects;

-- Lecture publique inchangée (nécessaire à l'affichage des images sur le site).
create policy "media: lecture publique"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "media: upload responsable"
  on storage.objects for insert
  with check (
    bucket_id = 'media'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('responsable', 'super_admin')
    )
  );

create policy "media: modification responsable"
  on storage.objects for update
  using (
    bucket_id = 'media'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('responsable', 'super_admin')
    )
  );

create policy "media: suppression responsable"
  on storage.objects for delete
  using (
    bucket_id = 'media'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('responsable', 'super_admin')
    )
  );

commit;

-- ============================================================================
-- VÉRIFICATION (optionnel, à lancer séparément après le commit)
--
-- 1. Un membre normal ne doit plus pouvoir changer son rôle :
--      update public.profiles set role = 'super_admin' where id = auth.uid();
--    → doit lever "Modification du rôle réservée aux super administrateurs"
--
-- 2. Lister les policies actives :
--      select tablename, policyname, cmd from pg_policies
--      where schemaname in ('public','storage')
--        and (tablename = 'profiles' or tablename = 'objects')
--      order by tablename, policyname;
--
-- 3. Vérifier les grants sur les fonctions de notification (doit lister
--    UNE seule ligne par fonction, avec grantee = authenticated uniquement —
--    ni anon, ni PUBLIC) :
--      select routine_name, grantee, privilege_type
--      from information_schema.role_routine_grants
--      where routine_name in ('notifier_tous','notifier_responsables','notifier_membre');
--
-- 4. Confirmer qu'il n'y a plus qu'une seule signature par fonction :
--      select p.proname, pg_get_function_arguments(p.oid) as arguments
--      from pg_proc p
--      join pg_namespace n on n.oid = p.pronamespace
--      where n.nspname = 'public'
--        and p.proname in ('notifier_tous', 'notifier_responsables', 'notifier_membre');
-- ============================================================================
