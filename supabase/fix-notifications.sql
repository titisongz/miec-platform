-- ============================================================================
-- NOTIFICATIONS — boîte de réception PAR destinataire + déclencheurs auto
-- À exécuter dans Supabase → SQL Editor (une seule fois). Idempotent.
--
-- Modèle : une ligne `notifications` PAR membre destinataire (champ `lu`).
-- Les notifications sont créées automatiquement (prière, témoignage, annonce,
-- enseignement, sortie, inscription IPB) et aussi par diffusion manuelle admin.
--
-- Le fan-out « notifier tous les membres / les responsables » lit la table
-- profiles, or la RLS `profiles: lecture proprio` interdit à un membre de lire
-- les autres profils. On passe donc par des fonctions SECURITY DEFINER qui
-- résolvent les destinataires côté serveur (en contournant la RLS).
--
-- `notifications_push` (table conservée) = simple JOURNAL des diffusions
-- manuelles du back-office, pour l'historique de /admin/notifications.
-- ============================================================================

begin;

-- Ancien suivi lu/non-lu (remplacé par la colonne notifications.lu).
drop table if exists public.notifications_lues cascade;

-- ── 1. Journal des diffusions manuelles admin (historique back-office) ───────
create table if not exists public.notifications_push (
  id          uuid primary key default gen_random_uuid(),
  titre       text not null,
  corps       text not null,
  module      text,
  url         text,
  statut      text not null default 'envoyee',
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_notifications_push_created_at
  on public.notifications_push(created_at desc);

-- ── 2. Boîte de réception par destinataire (modèle principal) ────────────────
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  type        text not null,   -- priere | temoignage | annonce | enseignement | evangelisation | inscription_ipb
  titre       text not null,
  message     text not null,
  lien        text,            -- URL relative vers le contenu (ex. /priere)
  lu          boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists idx_notifications_profile
  on public.notifications(profile_id, created_at desc);
create index if not exists idx_notifications_unread
  on public.notifications(profile_id) where lu = false;

-- ── 3. RLS ───────────────────────────────────────────────────────────────────
alter table public.notifications      enable row level security;
alter table public.notifications_push enable row level security;

-- notifications : chaque membre ne voit / ne modifie QUE les siennes.
-- L'insert est ouvert aux authenticated (les fonctions de fan-out ci-dessous
-- insèrent pour autrui, mais sont de toute façon SECURITY DEFINER).
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

-- notifications_push : lecture publique (historique admin), écriture responsable.
drop policy if exists "notifications_push: lecture publique" on public.notifications_push;
create policy "notifications_push: lecture publique"
  on public.notifications_push for select using (true);

drop policy if exists "notifications_push: écriture responsable" on public.notifications_push;
create policy "notifications_push: écriture responsable"
  on public.notifications_push for all
  using (est_responsable()) with check (est_responsable());

-- ── 4. Fonctions de fan-out (SECURITY DEFINER : lisent profiles malgré la RLS) ─
-- `id is distinct from auth.uid()` exclut l'auteur de l'action (et reste
-- correct quand auth.uid() est NULL, ex. inscription IPB par un visiteur).

create or replace function public.notifier_tous(
  p_type text, p_titre text, p_message text, p_lien text
) returns void
language sql security definer set search_path = public as $$
  insert into public.notifications (profile_id, type, titre, message, lien)
  select p.id, p_type, p_titre, p_message, p_lien
  from public.profiles p
  where p.id is distinct from auth.uid();
$$;

create or replace function public.notifier_responsables(
  p_type text, p_titre text, p_message text, p_lien text
) returns void
language sql security definer set search_path = public as $$
  insert into public.notifications (profile_id, type, titre, message, lien)
  select p.id, p_type, p_titre, p_message, p_lien
  from public.profiles p
  where p.role in ('responsable', 'super_admin')
    and p.id is distinct from auth.uid();
$$;

create or replace function public.notifier_membre(
  p_profile uuid, p_type text, p_titre text, p_message text, p_lien text
) returns void
language sql security definer set search_path = public as $$
  insert into public.notifications (profile_id, type, titre, message, lien)
  values (p_profile, p_type, p_titre, p_message, p_lien);
$$;

grant execute on function public.notifier_tous(text, text, text, text)               to anon, authenticated;
grant execute on function public.notifier_responsables(text, text, text, text)        to anon, authenticated;
grant execute on function public.notifier_membre(uuid, text, text, text, text)        to anon, authenticated;

commit;
