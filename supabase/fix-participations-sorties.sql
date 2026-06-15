-- ============================================================================
-- Évangélisation — Participations aux sorties
-- À exécuter dans Supabase → SQL Editor (une seule fois). Idempotent.
--
-- Permet à un membre connecté de s'inscrire / se désinscrire d'une sortie
-- (bouton « Je participe » dans le détail d'une sortie). Modèle identique à
-- la table favoris (clé composite profile_id + sortie_id).
-- ============================================================================

begin;

-- ── 1. Table ─────────────────────────────────────────────────────────────────
create table if not exists public.participations_sorties (
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  sortie_id   uuid not null references public.sorties(id)  on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (profile_id, sortie_id)
);

-- Index pour compter rapidement les participants d'une sortie.
create index if not exists idx_participations_sortie_id
  on public.participations_sorties(sortie_id);

-- ── 2. RLS ───────────────────────────────────────────────────────────────────
alter table public.participations_sorties enable row level security;

-- Lecture publique (permet d'afficher le nombre de participants à tous).
drop policy if exists "participations: lecture publique" on public.participations_sorties;
create policy "participations: lecture publique"
  on public.participations_sorties for select using (true);

-- Insertion réservée aux utilisateurs connectés, et uniquement pour eux-mêmes.
drop policy if exists "participations: insertion connecté" on public.participations_sorties;
create policy "participations: insertion connecté"
  on public.participations_sorties for insert to authenticated
  with check (profile_id = auth.uid());

-- Suppression réservée au propriétaire de la participation.
drop policy if exists "participations: suppression proprio" on public.participations_sorties;
create policy "participations: suppression proprio"
  on public.participations_sorties for delete to authenticated
  using (profile_id = auth.uid());

commit;

-- ============================================================================
-- Vérification (optionnel) :
--   select sortie_id, count(*) from public.participations_sorties group by sortie_id;
-- ============================================================================
