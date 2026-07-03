-- ============================================================================
-- ANTI-SPAM IPB — 1 inscription par email / 24h
-- À exécuter dans Supabase → SQL Editor (une seule fois). Idempotent.
--
-- Corrige l'audit du 2026-07-03 : le formulaire d'inscription IPB
-- (supabase/schema.sql → "inscriptions: soumission publique" with check
-- (true)) accepte des inserts anonymes sans aucune limite — ouvert au spam.
--
-- Deux écarts par rapport au trigger initialement proposé :
--
--  1. SECURITY DEFINER — sans ça, la fonction du trigger s'exécute avec les
--     droits de l'appelant (SECURITY INVOKER, le défaut). Sa sous-requête
--     `select 1 from ipb_inscriptions where email = ...` serait alors
--     elle-même filtrée par la policy RLS de lecture ("inscriptions: lecture
--     proprio ou responsable" → profile_id = auth.uid() or est_responsable()),
--     qui ne laisse PERSONNE d'anonyme voir les lignes des autres. Le
--     visiteur anonyme — le cas principal à limiter — ne verrait donc jamais
--     sa propre soumission précédente, et la limite serait silencieusement
--     inopérante pour lui. SECURITY DEFINER fait lire la table au trigger
--     avec les droits du propriétaire, en dehors de la RLS.
--
--  2. Comparaison insensible à la casse (lower(email)) — un email n'est pas
--     sensible à la casse en pratique ; comparer tel quel permettrait de
--     contourner la limite avec "Test@Mail.com" puis "test@mail.com".
-- ============================================================================

begin;

create or replace function public.check_inscription_rate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.ipb_inscriptions
    where lower(email) = lower(new.email)
      and created_at > now() - interval '24 hours'
  ) then
    raise exception 'Une inscription avec cet email a déjà été soumise récemment';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_check_inscription_rate on public.ipb_inscriptions;
create trigger trg_check_inscription_rate
  before insert on public.ipb_inscriptions
  for each row execute function public.check_inscription_rate();

commit;

-- ============================================================================
-- Vérification (optionnel) — la 2e insertion doit échouer :
--   insert into public.ipb_inscriptions (nom, email) values ('Test 1', 'spam@test.com');
--   insert into public.ipb_inscriptions (nom, email) values ('Test 2', 'SPAM@test.com');
--   → « Une inscription avec cet email a déjà été soumise récemment »
-- ============================================================================
