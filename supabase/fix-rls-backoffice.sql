-- ============================================================================
-- FIX RLS — Back-office : création / suppression de contenu impossible
-- ----------------------------------------------------------------------------
-- À exécuter dans Supabase → SQL Editor (une seule fois). Idempotent.
--
-- Contexte
--   Tous les modules du back-office échouaient à créer / supprimer du contenu.
--   Cause : les policies d'écriture s'appuyaient sur est_responsable(), qui lit
--   public.profiles. Si cette fonction n'est pas SECURITY DEFINER dans la base,
--   l'évaluation d'une policy SUR profiles qui appelle est_responsable() relit
--   profiles → « infinite recursion detected in policy for relation profiles »,
--   ce qui fait échouer en cascade toutes les écritures de contenu.
--
-- Correctif
--   1. est_responsable() recréée en SECURITY DEFINER (bypass RLS → pas de
--      récursion) — utilisée uniquement par les policies SUR profiles.
--   2. Toutes les policies d'écriture des tables de CONTENU passent à une
--      vérification directe EXISTS(... profiles ...), sans fonction.
--      (Sur une table de contenu, ce sous-SELECT lit la ligne profile de
--      l'utilisateur via `id = auth.uid()` — aucune récursion.)
-- ============================================================================

begin;

-- ── 1. Helper recursion-safe (réservé aux policies SUR profiles) ────────────
create or replace function public.est_responsable()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('responsable', 'super_admin')
  );
$$;

-- ── 2. profiles — supprimer la récursion ────────────────────────────────────
-- La lecture de SON propre profil passe par `id = auth.uid()` (pur, sans
-- fonction) ; l'accès « responsable voit tout » passe par la fonction
-- SECURITY DEFINER ci-dessus (qui bypass RLS, donc ne récurse pas).
drop policy if exists "profiles: lecture proprio"        on public.profiles;
drop policy if exists "profiles: mise à jour proprio"    on public.profiles;
drop policy if exists "profiles: admin peut tout modifier" on public.profiles;

create policy "profiles: lecture proprio"
  on public.profiles for select
  using (id = auth.uid() or public.est_responsable());

create policy "profiles: mise à jour proprio"
  on public.profiles for update
  using (id = auth.uid());

create policy "profiles: admin peut tout modifier"
  on public.profiles for update
  using (public.est_responsable())
  with check (public.est_responsable());

-- ── 3. Tables de CONTENU — écriture responsable via EXISTS direct ───────────
-- Prédicat identique partout :
--   EXISTS (SELECT 1 FROM public.profiles
--           WHERE id = auth.uid() AND role IN ('responsable','super_admin'))

-- versets
drop policy if exists "versets: écriture responsable" on public.versets;
create policy "versets: écriture responsable"
  on public.versets for all
  using      (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')));

-- series
drop policy if exists "series: écriture responsable" on public.series;
create policy "series: écriture responsable"
  on public.series for all
  using      (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')));

-- enseignements
drop policy if exists "enseignements: écriture responsable" on public.enseignements;
create policy "enseignements: écriture responsable"
  on public.enseignements for all
  using      (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')));

-- annonces
drop policy if exists "annonces: écriture responsable" on public.annonces;
create policy "annonces: écriture responsable"
  on public.annonces for all
  using      (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')));

-- ressources
drop policy if exists "ressources: écriture responsable" on public.ressources;
create policy "ressources: écriture responsable"
  on public.ressources for all
  using      (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')));

-- livres
drop policy if exists "livres: écriture responsable" on public.livres;
create policy "livres: écriture responsable"
  on public.livres for all
  using      (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')));

-- sorties
drop policy if exists "sorties: écriture responsable" on public.sorties;
create policy "sorties: écriture responsable"
  on public.sorties for all
  using      (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')));

-- rapports_sorties
drop policy if exists "rapports: écriture responsable" on public.rapports_sorties;
create policy "rapports: écriture responsable"
  on public.rapports_sorties for all
  using      (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')));

-- ipb_programme
drop policy if exists "ipb_programme: écriture responsable" on public.ipb_programme;
create policy "ipb_programme: écriture responsable"
  on public.ipb_programme for all
  using      (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')));

-- ipb_cours
drop policy if exists "ipb_cours: écriture responsable" on public.ipb_cours;
create policy "ipb_cours: écriture responsable"
  on public.ipb_cours for all
  using      (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')));

-- ipb_documents
drop policy if exists "ipb_documents: écriture responsable" on public.ipb_documents;
create policy "ipb_documents: écriture responsable"
  on public.ipb_documents for all
  using      (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')));

-- ── 4. Tables à workflow mixte — on ne remplace QUE les policies responsable ─
-- (les policies de soumission membre / publique restent inchangées)

-- temoignages : modération (update) + suppression (delete) responsable
drop policy if exists "temoignages: modération responsable"  on public.temoignages;
drop policy if exists "temoignages: suppression responsable" on public.temoignages;
create policy "temoignages: modération responsable"
  on public.temoignages for update
  using      (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')));
create policy "temoignages: suppression responsable"
  on public.temoignages for delete
  using      (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')));

-- prieres : modification (update) + suppression (delete) responsable
drop policy if exists "prieres: modification responsable" on public.prieres;
drop policy if exists "prieres: suppression responsable"  on public.prieres;
create policy "prieres: modification responsable"
  on public.prieres for update
  using      (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')));
create policy "prieres: suppression responsable"
  on public.prieres for delete
  using      (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')));

-- ipb_inscriptions : traitement (update) responsable
drop policy if exists "inscriptions: traitement responsable" on public.ipb_inscriptions;
create policy "inscriptions: traitement responsable"
  on public.ipb_inscriptions for update
  using      (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('responsable','super_admin')));

commit;

-- ============================================================================
-- VÉRIFICATION (optionnel) — lister les policies après application :
--   select tablename, policyname, cmd
--   from pg_policies where schemaname = 'public' order by tablename, policyname;
-- ============================================================================
