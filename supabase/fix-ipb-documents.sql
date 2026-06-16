-- ============================================================================
-- IPB — Documents de cours (ipb_documents)
-- À exécuter dans Supabase → SQL Editor (une seule fois). Idempotent.
--
-- Symptôme : les documents de cours ne s'affichent pas côté front.
-- Cause probable : la RLS de lecture n'est pas publique, ou la table /
-- la clé étrangère vers ipb_cours n'existe pas dans la base en ligne
-- (le join PostgREST docs:ipb_documents(*) échoue alors silencieusement).
--
-- Ce script (re)crée la table, la FK, l'index et la politique de LECTURE
-- PUBLIQUE sans toucher aux données existantes.
-- ============================================================================

begin;

-- ── 1. Table (no-op si elle existe déjà) ─────────────────────────────────────
create table if not exists public.ipb_documents (
  id          uuid primary key default gen_random_uuid(),
  cours_id    uuid not null references public.ipb_cours(id) on delete cascade,
  titre       text not null,
  fichier_url text,
  type        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index pour le join sur le cours.
create index if not exists idx_ipb_documents_cours_id
  on public.ipb_documents(cours_id);

-- ── 2. RLS ───────────────────────────────────────────────────────────────────
alter table public.ipb_documents enable row level security;

-- Lecture publique (indispensable pour l'affichage côté front).
drop policy if exists "ipb_documents: lecture publique" on public.ipb_documents;
create policy "ipb_documents: lecture publique"
  on public.ipb_documents for select
  using (true);

-- Écriture réservée aux responsables (back-office /admin/ipb).
drop policy if exists "ipb_documents: écriture responsable" on public.ipb_documents;
create policy "ipb_documents: écriture responsable"
  on public.ipb_documents for all
  using (est_responsable()) with check (est_responsable());

commit;

-- ── Diagnostic (à lancer séparément après le commit) ─────────────────────────
-- Combien de documents, et sont-ils bien rattachés à un cours existant ?
--
--   select d.id, d.titre, d.fichier_url, d.cours_id, c.code, c.titre as cours
--     from public.ipb_documents d
--     left join public.ipb_cours c on c.id = d.cours_id
--    order by c.code;
--
-- Si 0 ligne : la table est vide, c'est normal que rien ne s'affiche.
-- Créez les documents depuis le back-office : /admin/ipb → onglet Cours.
