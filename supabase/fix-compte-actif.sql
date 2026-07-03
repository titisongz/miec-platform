-- ============================================================================
-- COMPTE ACTIF — colonne pour la désactivation de compte (super admin)
-- À exécuter dans Supabase → SQL Editor (une seule fois). Idempotent.
--
-- Corrige l'audit du 2026-07-03 : /superadmin/membres appelait
-- updateProfileRole(id, 'visiteur') pour « désactiver » un compte, mais
-- 'visiteur' n'existe pas dans l'enum role_utilisateur ('membre' |
-- 'responsable' | 'super_admin') — l'action levait systématiquement une
-- erreur Postgres et n'a donc jamais fonctionné.
--
-- ATTENTION — portée volontairement limitée à ce que demande l'audit :
-- cette colonne existe et le bouton « Désactiver le compte » l'écrit
-- désormais correctement (plus d'erreur), mais RIEN ne la LIT encore pour
-- bloquer l'accès d'un compte désactivé (ni components/App.tsx à la
-- connexion, ni RLS). Un compte marqué actif=false peut donc aujourd'hui
-- continuer à utiliser l'application normalement. Faire respecter ce flag
-- (bloquer la connexion / les policies RLS) est un chantier séparé, plus
-- large, à traiter explicitement si besoin.
-- ============================================================================

begin;

alter table public.profiles
  add column if not exists actif boolean not null default true;

-- profils_avec_email() (schema.sql) alimente l'annuaire super admin
-- (getAllProfiles/getRecentSignups) mais ne renvoyait pas `actif` — sans ce
-- correctif, le statut désactivé disparaîtrait dès le prochain rechargement
-- de la page (l'UI ne verrait jamais la vraie valeur en base). Le type de
-- retour change (colonne ajoutée) : on DROP puis recrée plutôt que
-- CREATE OR REPLACE, qui interdit de modifier la liste des colonnes.
drop function if exists public.profils_avec_email();

create function public.profils_avec_email()
returns table (
  id           uuid,
  nom_complet  text,
  email        text,
  role         role_utilisateur,
  etudiant_ipb boolean,
  actif        boolean,
  created_at   timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.nom_complet, u.email::text, p.role, p.etudiant_ipb, p.actif, p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where est_responsable()
$$;

grant execute on function public.profils_avec_email() to authenticated;

commit;

-- ============================================================================
-- Vérification (optionnel) :
--   select id, nom_complet, role, actif from public.profiles where actif = false;
-- ============================================================================
