-- ============================================================================
-- COMPTE ACTIF — application au niveau RLS (défense en profondeur)
-- À exécuter APRÈS supabase/fix-compte-actif.sql. Idempotent.
--
-- fix-compte-actif.sql a ajouté profiles.actif mais rien ne l'appliquait :
-- un compte désactivé pouvait continuer à écrire tant que son JWT restait
-- valide (App.tsx ne le déconnecte qu'au prochain chargement de session,
-- cf. son propre correctif côté client). Ce script ferme la fenêtre : même
-- avec un token encore valide, un compte actif=false ne peut plus rien
-- INSÉRER dans les tables de contribution membre.
--
-- Portée : uniquement les policies d'INSERT listées par l'audit
-- (temoignages, prieres, favoris, ipb_inscriptions, participations_sorties).
-- Pas de UPDATE/DELETE ni d'autres tables — hors demande, et la plupart des
-- UPDATE/DELETE sur ces tables sont déjà réservés aux responsables.
--
-- Aucun risque de récursion RLS : ces policies vivent sur temoignages /
-- prieres / favoris / ipb_inscriptions / participations_sorties, PAS sur
-- profiles elle-même — la sous-requête directe sur profiles est donc sûre
-- (contrairement à une policy définie SUR profiles, cf. fix-rls-backoffice.sql).
-- ============================================================================

begin;

-- ── temoignages ───────────────────────────────────────────────────────────
drop policy if exists "temoignages: soumission membre" on public.temoignages;
create policy "temoignages: soumission membre"
  on public.temoignages for insert
  with check (
    auteur_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and actif = true)
  );

-- ── prieres ───────────────────────────────────────────────────────────────
drop policy if exists "prieres: soumission membre" on public.prieres;
create policy "prieres: soumission membre"
  on public.prieres for insert
  with check (
    auteur_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and actif = true)
  );

-- ── favoris ───────────────────────────────────────────────────────────────
drop policy if exists "favoris: insert proprio" on public.favoris;
create policy "favoris: insert proprio"
  on public.favoris for insert
  with check (
    profile_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and actif = true)
  );

-- ── ipb_inscriptions ──────────────────────────────────────────────────────
-- Cette policy reste ouverte aux visiteurs NON connectés (auth.uid() null) —
-- c'est le comportement voulu (formulaire public sans compte). Seul un
-- utilisateur CONNECTÉ et désactivé est bloqué.
drop policy if exists "inscriptions: soumission publique" on public.ipb_inscriptions;
create policy "inscriptions: soumission publique"
  on public.ipb_inscriptions for insert
  with check (
    auth.uid() is null
    or exists (select 1 from public.profiles where id = auth.uid() and actif = true)
  );

-- ── participations_sorties ───────────────────────────────────────────────
drop policy if exists "participations: insertion connecté" on public.participations_sorties;
create policy "participations: insertion connecté"
  on public.participations_sorties for insert to authenticated
  with check (
    profile_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and actif = true)
  );

commit;

-- ============================================================================
-- Vérification (optionnel) — en tant que compte désactivé (actif=false),
-- chacun de ces inserts doit être rejeté par la policy :
--   insert into public.prieres (auteur_id, sujet) values (auth.uid(), 'test');
--   insert into public.favoris (profile_id, contenu_type, contenu_id)
--     values (auth.uid(), 'enseignement', gen_random_uuid());
-- → « new row violates row-level security policy »
-- ============================================================================
