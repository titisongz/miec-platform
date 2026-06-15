-- ============================================================================
-- IPB — Mise à jour du contenu vitrine (vraies valeurs) + clés médias
-- À exécuter dans Supabase → SQL Editor APRÈS fix-ipb-vitrine.sql. Idempotent.
--
-- 1. Remplace les 13 clés de contenu par les valeurs réelles de la formation.
-- 2. Ajoute deux clés médias :
--      banniere_url   → URL de la bannière épinglée (vide au départ)
--      photos_galerie → tableau JSON d'URLs de la galerie (vide au départ)
--
-- Prérequis : la table public.ipb_vitrine existe (créée par fix-ipb-vitrine.sql).
-- Les images sont stockées dans le bucket Storage « media », dossier ipb/
-- (bucket créé par fix-media-modules.sql).
-- ============================================================================

begin;

-- ── 1. Mise à jour des 13 clés de contenu ────────────────────────────────────
update public.ipb_vitrine set valeur = 'Bâtir la vie de Christ dans les vases de terre'      where cle = 'description';
update public.ipb_vitrine set valeur = 'Formation accélérée'                                  where cle = 'depuis';
update public.ipb_vitrine set valeur = '2 mois'                                               where cle = 'cursus';
update public.ipb_vitrine set valeur = 'Attestation de formation'                             where cle = 'diplome';
update public.ipb_vitrine set valeur = 'Présentiel · Tous les samedis'                        where cle = 'modalite';
update public.ipb_vitrine set valeur = '10 000 FCFA'                                          where cle = 'frais';
update public.ipb_vitrine set valeur = 'Paiement OM : 658 923 857'                            where cle = 'frais_note';
update public.ipb_vitrine set valeur = '27 juin 2026'                                         where cle = 'date_inscriptions';
update public.ipb_vitrine set valeur = '29 août 2026'                                         where cle = 'date_cloture';
update public.ipb_vitrine set valeur = '27 juin 2026'                                         where cle = 'date_rentree';
update public.ipb_vitrine set valeur = 'Être né de nouveau et recommandé par son église'     where cle = 'condition_1';
update public.ipb_vitrine set valeur = 'Cours tous les samedis de 09h à 11h30'               where cle = 'condition_2';
update public.ipb_vitrine set valeur = 'Durée 2 mois — du 27 juin au 29 août 2026'           where cle = 'condition_3';

-- ── 2. Nouvelles clés médias (créées si absentes, jamais écrasées) ───────────
insert into public.ipb_vitrine (cle, valeur) values
  ('banniere_url',   ''),
  ('photos_galerie', '[]')
on conflict (cle) do nothing;

commit;

-- ============================================================================
-- Vérification (optionnel) :
--   select cle, valeur, updated_at from public.ipb_vitrine order by cle;
-- ============================================================================
