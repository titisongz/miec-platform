-- ============================================================================
-- SÉRIES — fusion des doublons créés avant le correctif de matching par titre
-- À exécuter dans Supabase → SQL Editor (une seule fois). Idempotent.
--
-- Origine : le formulaire d'enseignement du back-office proposait une saisie
-- LIBRE du nom de série, et app/admin/enseignements/page.tsx résolvait ce nom
-- en id via `series.find(s => s.titre === f.serie)` — une comparaison stricte.
-- Toute différence de casse ou d'espace créait donc une série de plus au lieu
-- de réutiliser l'existante. Le formulaire manipule désormais `serie_id` via
-- un vrai select, ce qui ferme la source du problème ; ce script nettoie les
-- doublons déjà en base.
--
-- Règle de fusion : on conserve la série la plus ANCIENNE de chaque groupe
-- (created_at le plus petit, l'id départageant en cas d'égalité stricte),
-- même si elle ne porte encore aucun enseignement. Les enseignements des
-- doublons lui sont réattribués, puis les doublons sont supprimés.
--
-- Regroupement : lower(trim(titre)). Les accents ne sont PAS normalisés —
-- « Prière » et « Priere » restent donc deux séries distinctes, ce qui est
-- volontaire : les fusionner serait une décision éditoriale, pas un nettoyage.
--
-- Attendu pour l'exécution du 2026-07-20 (2 groupes diagnostiqués) :
--   « foi »               → conserve 48b52412…, supprime da8725c7… et 0732c904…
--   « marche chrétienne » → conserve 74b32280…, supprime 994e7bbe… et c9346df4…
--   soit 4 enseignements réattribués et 4 séries supprimées.
-- Le script ne code en dur AUCUN de ces identifiants : il retraite ce qu'il
-- trouve, et ne fait rien s'il n'y a plus de doublon.
-- ============================================================================

begin;

-- ── 1. Table de correspondance « doublon → série conservée » ─────────────────
-- Construite dynamiquement : fonctionne quel que soit le nombre de groupes.
create temporary table _series_fusion on commit drop as
with groupes as (
  select
    lower(trim(titre)) as cle,
    -- (array_agg(...))[1] = la plus ancienne. Le tri secondaire sur l'id rend
    -- le choix déterministe si deux lignes partagent le même created_at.
    (array_agg(id order by created_at, id))[1] as gardee
  from public.series
  group by lower(trim(titre))
  having count(*) > 1
)
select
  s.id      as doublon,
  g.gardee  as gardee
from public.series s
join groupes g on lower(trim(s.titre)) = g.cle
where s.id <> g.gardee;

-- ── 2. Réattribution des enseignements vers la série conservée ───────────────
-- À faire AVANT la suppression : sinon `on delete set null` (schema.sql) les
-- détacherait silencieusement et le lien série serait perdu.
update public.enseignements e
   set serie_id = f.gardee
  from _series_fusion f
 where e.serie_id = f.doublon;

-- ── 3. Suppression des doublons, désormais sans enseignement ─────────────────
delete from public.series s
 using _series_fusion f
 where s.id = f.doublon;

-- ── 4. Garde-fou : plus aucun doublon ne doit subsister ──────────────────────
-- Sans ce contrôle, la création de l'index ci-dessous échouerait sur une erreur
-- peu parlante (« could not create unique index … duplicate key »).
do $$
declare
  v_restants integer;
begin
  select count(*) into v_restants from (
    select 1
    from public.series
    group by lower(trim(titre))
    having count(*) > 1
  ) d;

  if v_restants > 0 then
    raise exception
      'Fusion incomplète : % groupe(s) de doublons subsistent. Index non créé, transaction annulée.',
      v_restants;
  end if;
end $$;

-- ── 5. Interdiction de toute récidive au niveau de la base ───────────────────
-- Le correctif applicatif (select sur serie_id) empêche déjà d'en recréer
-- depuis le back-office, mais rien n'empêchait un doublon d'arriver par une
-- autre voie (import, appel direct à l'API REST, script). L'index le refuse
-- désormais, casse et espaces superflus compris.
-- lower() et btrim() sont IMMUTABLE : utilisables dans un index d'expression.
create unique index if not exists series_titre_unique_idx
  on public.series (lower(trim(titre)));

commit;

-- ============================================================================
-- Vérification (à exécuter après le script) :
--
--   -- Doit renvoyer 0 ligne :
--   select lower(trim(titre)), count(*)
--   from public.series
--   group by lower(trim(titre))
--   having count(*) > 1;
--
--   -- Les séries conservées et leur nombre d'enseignements après fusion
--   -- (« foi » et « marche chrétienne » doivent afficher 2 chacune) :
--   select s.id, s.titre, s.created_at, count(e.id) as enseignements
--   from public.series s
--   left join public.enseignements e on e.serie_id = s.id
--   group by s.id, s.titre, s.created_at
--   order by s.created_at;
--
--   -- Aucun enseignement ne doit avoir été détaché au passage :
--   select count(*) from public.enseignements where serie_id is null;
--
-- Note : l'index rend l'insertion d'un titre en doublon impossible. Si un
-- import légitime échoue plus tard sur `series_titre_unique_idx`, c'est le
-- signe que la série existe déjà — il faut la réutiliser, pas la recréer.
-- ============================================================================
