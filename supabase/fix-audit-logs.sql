-- ============================================================================
-- AUDIT LOGS — Journal de sécurité du back-office (super admin)
-- À exécuter dans Supabase → SQL Editor (une seule fois). Idempotent.
--
-- Corrige l'audit du 2026-07-03 : lib/admin-queries.ts appelle déjà
-- logAction()/getActionLogs() sur une table `audit_logs` qui n'a jamais été
-- créée — /superadmin/logs affichait donc toujours « Aucun log trouvé »,
-- malgré l'UI qui annonce un journal actif et inaltérable.
--
-- Écart avec la 1re proposition de schéma (actor_id/cible_type/cible_id) :
-- tous les appels existants de logAction(action, cible, details) passent un
-- libellé humain en `cible` (ex. le nom d'une personne, "Resend",
-- "parametres") — jamais un UUID. Découper en `cible_type`/`cible_id`
-- forcerait à réécrire tous les appels et n'aurait pas de sens pour les
-- cibles qui ne sont pas des lignes de table (ex. "Resend"). On garde donc
-- une colonne `cible text` unique, alignée sur l'usage réel, et on renomme
-- juste `admin_id` → `actor_id` (nom de colonne plus explicite) sans casser
-- l'API `logAction`/`getActionLogs` côté app.
-- ============================================================================

begin;

create table if not exists public.audit_logs (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references public.profiles(id) on delete set null,
  action     text not null,
  cible      text,
  details    jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

alter table public.audit_logs enable row level security;

drop policy if exists "audit_logs: lecture super_admin" on public.audit_logs;
create policy "audit_logs: lecture super_admin"
  on public.audit_logs for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin')
  );

-- `actor_id = auth.uid()` en plus de `auth.uid() is not null` : empêche un
-- utilisateur authentifié d'insérer un log au nom de quelqu'un d'autre
-- (le journal se veut « inaltérable » — logAction() insère de toute façon
-- toujours actor_id = auth.uid(), donc ça ne change rien pour l'usage normal).
drop policy if exists "audit_logs: insert authenticated" on public.audit_logs;
create policy "audit_logs: insert authenticated"
  on public.audit_logs for insert
  with check (auth.uid() is not null and actor_id = auth.uid());

-- Pas de policy update/delete : aucune n'est nécessaire ni souhaitable pour
-- un journal d'audit — RLS refuse par défaut en l'absence de policy.

commit;

-- ============================================================================
-- Vérification (optionnel) :
--   select al.id, al.action, al.cible, al.details, al.created_at, p.nom_complet
--   from public.audit_logs al
--   left join public.profiles p on p.id = al.actor_id
--   order by al.created_at desc limit 20;
-- ============================================================================
