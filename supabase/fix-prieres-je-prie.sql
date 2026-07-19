-- ============================================================================
-- Prière — « Je prie pour ce sujet » persisté et partagé
-- À exécuter dans Supabase → SQL Editor (une seule fois). Idempotent.
--
-- Avant ce correctif, le clic « Je prie » ne vivait que dans l'état React du
-- navigateur : rien n'était écrit en base. Chaque utilisateur se voyait donc
-- « seul à prier » (compteur = 0 en base + 1 local) et l'admin ne voyait rien.
--
-- La table de jonction prie_par (profile_id + priere_id) existe déjà dans le
-- schéma mais n'était jamais alimentée. Ce script :
--   1. maintient prieres.compteur_prie = COUNT(prie_par) via un trigger, pour
--      que le total soit visible par TOUS (liste communauté + panel admin) ;
--   2. recompte les compteurs existants (backfill) ;
--   3. renforce l'INSERT (compte actif) au niveau RLS, comme les autres tables
--      de contribution membre (cf. fix-compte-actif-rls.sql).
--
-- Modèle identique à participations_sorties (« Je participe »).
-- ============================================================================

begin;

-- ── 1. Index de lecture « mes sujets » (idx_prie_par_priere_id existe déjà) ──
create index if not exists idx_prie_par_profile_id
  on public.prie_par(profile_id);

-- ── 2. Trigger : prieres.compteur_prie = nombre d'intercesseurs ──────────────
-- SECURITY DEFINER : un membre a le droit d'insérer/supprimer SA ligne prie_par
-- mais pas d'UPDATE prieres (réservé aux responsables). Le trigger met donc le
-- compteur à jour en contournant la RLS, à partir de la seule table qu'il vient
-- de modifier légitimement.
create or replace function public.sync_compteur_prie()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  pid uuid := coalesce(new.priere_id, old.priere_id);
begin
  update public.prieres
     set compteur_prie = (select count(*) from public.prie_par where priere_id = pid)
   where id = pid;
  return null;
end;
$$;

drop trigger if exists trg_prie_par_compteur on public.prie_par;
create trigger trg_prie_par_compteur
  after insert or delete on public.prie_par
  for each row execute function public.sync_compteur_prie();

-- ── 3. Backfill : aligne les compteurs sur l'état réel de prie_par ───────────
update public.prieres p
   set compteur_prie = (select count(*) from public.prie_par pp where pp.priere_id = p.id);

-- ── 4. RLS INSERT : réservé au propriétaire ET à un compte actif ─────────────
-- (mise en cohérence avec favoris / prieres / participations_sorties.)
drop policy if exists "prie_par: insert proprio" on public.prie_par;
create policy "prie_par: insert proprio"
  on public.prie_par for insert to authenticated
  with check (
    profile_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and actif = true)
  );

commit;

-- ============================================================================
-- Vérification (optionnel) :
--   select id, sujet, compteur_prie from public.prieres order by compteur_prie desc;
--   select priere_id, count(*) from public.prie_par group by priere_id;
-- Les deux doivent concorder.
-- ============================================================================
