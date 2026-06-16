-- ============================================================================
-- NOTIFICATIONS — centre in-app (broadcast admin + suivi lu/non-lu par membre)
-- À exécuter dans Supabase → SQL Editor (une seule fois). Idempotent.
--
-- • notifications_push : messages diffusés depuis /admin/notifications.
-- • notifications_lues : quelles notifications chaque membre a déjà lues
--   (le badge « non lus » du front = total − lues).
-- Les préférences email/WhatsApp vivent déjà dans profiles (notif_email,
-- notif_whatsapp) → aucune colonne à créer ici.
-- ============================================================================

begin;

-- ── 1. Table des notifications diffusées ─────────────────────────────────────
create table if not exists public.notifications_push (
  id          uuid primary key default gen_random_uuid(),
  titre       text not null,
  corps       text not null,
  module      text,                       -- libellé de catégorie (ou NULL = Général)
  url         text,                       -- deeplink optionnel
  statut      text not null default 'envoyee',
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_notifications_push_created_at
  on public.notifications_push(created_at desc);

-- ── 2. Suivi des lectures par membre ─────────────────────────────────────────
create table if not exists public.notifications_lues (
  profile_id      uuid not null references public.profiles(id)          on delete cascade,
  notification_id uuid not null references public.notifications_push(id) on delete cascade,
  lu_at           timestamptz not null default now(),
  primary key (profile_id, notification_id)
);

create index if not exists idx_notifications_lues_profile
  on public.notifications_lues(profile_id);

-- ── 3. RLS ───────────────────────────────────────────────────────────────────
alter table public.notifications_push enable row level security;
alter table public.notifications_lues enable row level security;

-- notifications_push : lecture publique (le front filtre les visiteurs côté UI),
-- écriture réservée aux responsables (back-office).
drop policy if exists "notifications_push: lecture publique" on public.notifications_push;
create policy "notifications_push: lecture publique"
  on public.notifications_push for select
  using (true);

drop policy if exists "notifications_push: écriture responsable" on public.notifications_push;
create policy "notifications_push: écriture responsable"
  on public.notifications_push for all
  using (est_responsable()) with check (est_responsable());

-- notifications_lues : chaque membre ne voit / n'écrit QUE ses propres lectures.
drop policy if exists "notifications_lues: lecture proprio" on public.notifications_lues;
create policy "notifications_lues: lecture proprio"
  on public.notifications_lues for select
  using (profile_id = auth.uid());

drop policy if exists "notifications_lues: insert proprio" on public.notifications_lues;
create policy "notifications_lues: insert proprio"
  on public.notifications_lues for insert
  with check (profile_id = auth.uid());

drop policy if exists "notifications_lues: delete proprio" on public.notifications_lues;
create policy "notifications_lues: delete proprio"
  on public.notifications_lues for delete
  using (profile_id = auth.uid());

commit;
