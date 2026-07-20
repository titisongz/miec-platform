-- ============================================================================
-- PRIÈRE — lecture publique du mur de prière (et de son compteur)
-- À exécuter dans Supabase → SQL Editor (une seule fois). Idempotent.
--
-- Bug corrigé : un visiteur non connecté voyait « 0 personne prie » sur chaque
-- sujet. La policy d'origine (supabase/schema.sql) réservait la lecture de la
-- table prieres aux comptes connectés :
--
--     create policy "prieres: lecture connecté"
--       on public.prieres for select
--       using (auth.uid() is not null);
--
-- Pour le rôle `anon`, tout SELECT sur prieres était donc filtré à zéro ligne.
-- getPrieres() (lib/queries.ts) recevait une liste vide et retombait sur le
-- repli DB.PRIERES, et getModuleCounts() comptait 0 sujet : le mur de prière
-- et son compteur compteur_prie étaient invisibles hors connexion.
--
-- Le mur de prière est un contenu public de la plateforme, au même titre que
-- les annonces ou les témoignages publiés (dont les policies autorisent déjà
-- `anon`). On aligne donc prieres sur ce modèle : lecture pour tous, écriture
-- inchangée (INSERT propriétaire + compte actif, UPDATE/DELETE responsables).
--
-- NOTE — ce qui reste volontairement privé :
--   * prie_par garde sa policy « lecture proprio » : savoir QUI prie pour quoi
--     reste réservé à l'utilisateur concerné. Seul l'agrégat dénormalisé
--     prieres.compteur_prie (maintenu par le trigger de
--     supabase/fix-prieres-je-prie.sql) est public — c'est lui qu'affiche l'UI.
--   * L'anonymat de l'auteur est déjà géré côté applicatif via prieres.anonyme.
-- ============================================================================

begin;

drop policy if exists "prieres: lecture connecté" on public.prieres;
drop policy if exists "prieres: lecture publique" on public.prieres;

create policy "prieres: lecture publique"
  on public.prieres for select
  using (true);

commit;

-- ============================================================================
-- Vérification (optionnel) :
--   -- En tant qu'anon, doit renvoyer les sujets et leur compteur :
--   set local role anon;
--   select id, sujet, compteur_prie from public.prieres order by created_at desc;
--   reset role;
--
--   -- La policy doit apparaître avec roles = {public} :
--   select polname, polcmd, pg_get_expr(polqual, polrelid) as using_expr
--   from pg_policy where polrelid = 'public.prieres'::regclass;
-- ============================================================================
