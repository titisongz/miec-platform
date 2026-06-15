-- ============================================================================
-- IPB — Vitrine éditable depuis le back-office
-- À exécuter dans Supabase → SQL Editor (une seule fois). Idempotent.
--
-- Avant exécution, la page vitrine de l'IPB affiche des valeurs codées en dur
-- (le front retombe sur les mêmes valeurs par défaut via getIPBVitrine()).
-- Après exécution, ces valeurs deviennent modifiables dans Admin → IPB → Vitrine.
--
-- Modèle clé/valeur : une ligne par champ affiché. Clés attendues :
--   description, depuis, cursus, diplome, modalite, frais, frais_note,
--   date_inscriptions, date_cloture, date_rentree,
--   condition_1, condition_2, condition_3
-- ============================================================================

begin;

-- ── 0. Fonction trigger updated_at (déjà créée par schema.sql ; recréée ici
--      pour rendre ce script autonome). ───────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── 1. Table ─────────────────────────────────────────────────────────────────
create table if not exists public.ipb_vitrine (
  id          uuid primary key default gen_random_uuid(),
  cle         text not null unique,
  valeur      text,
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_ipb_vitrine_updated_at on public.ipb_vitrine;
create trigger trg_ipb_vitrine_updated_at
  before update on public.ipb_vitrine
  for each row execute function public.set_updated_at();

-- ── 2. RLS : lecture publique, écriture responsable ──────────────────────────
alter table public.ipb_vitrine enable row level security;

drop policy if exists "ipb_vitrine: lecture publique" on public.ipb_vitrine;
create policy "ipb_vitrine: lecture publique"
  on public.ipb_vitrine for select using (true);

drop policy if exists "ipb_vitrine: écriture responsable" on public.ipb_vitrine;
create policy "ipb_vitrine: écriture responsable"
  on public.ipb_vitrine for all
  using      (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')));

-- ── 3. Données initiales — exactement ce qui est affiché sur le front ────────
-- `on conflict do nothing` : ré-exécuter le script n'écrase pas les
-- modifications déjà faites depuis le back-office.
insert into public.ipb_vitrine (cle, valeur) values
  ('description',       'L''Institut de Pédagogie Biblique offre une formation théologique rigoureuse et accessible, au service de l''Église et de la mission.'),
  ('depuis',            '2009'),
  ('cursus',            '3 ans'),
  ('diplome',           'Certificat'),
  ('modalite',          'Présentiel + en ligne'),
  ('frais',             '75 000 FCFA'),
  ('frais_note',        'échelonnement possible'),
  ('date_inscriptions', '5 mai 2026'),
  ('date_cloture',      '15 août 2026'),
  ('date_rentree',      '14 sept. 2026'),
  ('condition_1',       'Être né de nouveau et recommandé par son église'),
  ('condition_2',       'Niveau minimum : classe de Terminale'),
  ('condition_3',       'Lettre de motivation et entretien')
on conflict (cle) do nothing;

commit;

-- ============================================================================
-- Vérification (optionnel) :
--   select cle, valeur, updated_at from public.ipb_vitrine order by cle;
-- ============================================================================
