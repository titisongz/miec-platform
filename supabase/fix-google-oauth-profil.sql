-- ============================================================================
-- GOOGLE OAUTH — nom du profil créé automatiquement
-- À exécuter dans Supabase → SQL Editor (une seule fois). Idempotent.
--
-- Le trigger trg_on_auth_user_created se déclenche bien sur TOUT insert dans
-- auth.users, quel que soit le fournisseur : un profil est donc déjà créé pour
-- un utilisateur Google, et rien n'échoue. MAIS la version d'origine
-- (supabase/schema.sql) ne lisait qu'une seule clé de métadonnées :
--
--     coalesce(new.raw_user_meta_data->>'nom_complet', new.email)
--
-- 'nom_complet' est la clé que NOUS envoyons au signUp email/mot de passe
-- (components/pages/compte.tsx). Google, lui, renseigne 'full_name' et 'name'
-- — jamais 'nom_complet'. Le coalesce retombait donc sur l'email, et tout
-- utilisateur Google apparaissait dans l'app sous son adresse email :
-- « Bonjour, prenom.nom@gmail.com », idem comme auteur d'un témoignage ou
-- d'un sujet de prière.
--
-- Ce script ajoute les clés Google au coalesce (l'email ne reste qu'en dernier
-- recours) et rattrape les profils déjà créés dans ce cas.
-- ============================================================================

begin;

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nom_complet)
  values (
    new.id,
    -- nullif(..., '') : une métadonnée présente mais vide ne doit pas gagner
    -- contre le repli suivant.
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'nom_complet'), ''),  -- signup email/mdp (notre app)
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),    -- Google (et la plupart des OAuth)
      nullif(trim(new.raw_user_meta_data->>'name'), ''),         -- Google (repli)
      new.email
    )
  )
  on conflict (id) do nothing;   -- ré-exécution / profil déjà présent : sans effet
  return new;
end;
$$;

-- Backfill : profils dont le nom est resté l'email alors que le fournisseur
-- avait bien transmis un nom (comptes Google créés avant ce correctif).
update public.profiles p
   set nom_complet = coalesce(
         nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
         nullif(trim(u.raw_user_meta_data->>'name'), '')
       )
  from auth.users u
 where u.id = p.id
   and p.nom_complet = u.email
   and coalesce(
         nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
         nullif(trim(u.raw_user_meta_data->>'name'), '')
       ) is not null;

commit;

-- ============================================================================
-- À FAIRE AUSSI, côté console (le SQL ne peut pas le configurer) :
--   1. Supabase → Authentication → Providers → Google : activer, coller le
--      Client ID et le Client Secret obtenus dans Google Cloud Console
--      (APIs & Services → Credentials → OAuth 2.0 Client ID, type « Web »).
--   2. Google Cloud Console → « Authorized redirect URIs » : ajouter
--      https://<projet>.supabase.co/auth/v1/callback
--   3. Supabase → Authentication → URL Configuration → « Redirect URLs » :
--      ajouter http://localhost:3000/auth/callback et l'URL de production
--      https://<domaine>/auth/callback (sinon Supabase refuse le redirectTo).
--
-- Vérification (optionnel) :
--   select id, email, raw_user_meta_data->>'full_name' as google_name
--   from auth.users order by created_at desc limit 5;
--   select id, nom_complet from public.profiles order by created_at desc limit 5;
-- ============================================================================
