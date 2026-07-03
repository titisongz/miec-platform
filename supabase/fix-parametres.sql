-- ============================================================================
-- PARAMETRES — Réglages globaux du back-office (super admin)
-- À exécuter dans Supabase → SQL Editor (une seule fois). Idempotent.
--
-- Corrige l'audit du 2026-07-03 : /superadmin/parametres lit/écrit une table
-- `parametres` qui n'a jamais été créée — chaque « Enregistrer » échouait
-- silencieusement (erreur non vérifiée) et les toggles n'avaient jamais
-- d'effet nulle part.
--
-- Modèle clé/valeur, même pattern que public.ipb_vitrine.
-- ============================================================================

begin;

-- Fonction trigger déjà créée par schema.sql — recréée ici pour que ce
-- script reste autonome (même précaution que fix-ipb-vitrine.sql).
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.parametres (
  cle        text primary key,
  valeur     text,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_parametres_updated_at on public.parametres;
create trigger trg_parametres_updated_at
  before update on public.parametres
  for each row execute function public.set_updated_at();

alter table public.parametres enable row level security;

drop policy if exists "parametres: lecture publique" on public.parametres;
create policy "parametres: lecture publique"
  on public.parametres for select using (true);

drop policy if exists "parametres: écriture super_admin" on public.parametres;
create policy "parametres: écriture super_admin"
  on public.parametres for all
  using      (exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin'));

-- Seed — clés RÉELLEMENT lues par app/superadmin/parametres/page.tsx.
-- Note : la clé est `inscription_ouverte` (singulier) dans le code, pas
-- `inscriptions_ouvertes` — utiliser l'orthographe exacte, sinon la valeur
-- semée ne serait jamais lue par la page (elle retomberait silencieusement
-- sur son défaut client `true`).
insert into public.parametres (cle, valeur) values
  ('mode_maintenance',    'false'),
  ('moderation_auto',     'false'),
  ('inscription_ouverte', 'false')
on conflict (cle) do nothing;

commit;

-- ============================================================================
-- Vérification (optionnel) :
--   select cle, valeur, updated_at from public.parametres order by cle;
-- ============================================================================
