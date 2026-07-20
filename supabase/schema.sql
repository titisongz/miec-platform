-- ============================================================
--  MIEC — Schéma Supabase complet
--  Copier-coller dans l'éditeur SQL de Supabase
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 0. EXTENSIONS
-- ────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";


-- ────────────────────────────────────────────────────────────
-- 1. TYPES ENUM
-- ────────────────────────────────────────────────────────────
create type role_utilisateur   as enum ('membre', 'responsable', 'super_admin');
create type statut_temoignage  as enum ('en_attente', 'publie', 'refuse');
create type type_enseignement  as enum ('video', 'texte');
create type type_ressource     as enum ('pdf', 'audio', 'partition', 'plan');
create type statut_sortie      as enum ('a_venir', 'passee');
create type statut_inscription as enum ('en_attente', 'validee', 'refusee');


-- ────────────────────────────────────────────────────────────
-- 2. FONCTION TRIGGER updated_at (partagée par toutes les tables)
-- ────────────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Macro pour attacher le trigger (appelée table par table ci-dessous)
-- (Supabase ne supporte pas les procédures DDL dynamiques dans les migrations
--  standard — chaque trigger est créé explicitement)


-- ────────────────────────────────────────────────────────────
-- 3. TABLES
-- ────────────────────────────────────────────────────────────

-- 3.1 profiles -------------------------------------------------
create table public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  nom_complet          text,
  telephone_whatsapp   text,
  role                 role_utilisateur not null default 'membre',
  etudiant_ipb         boolean not null default false,
  notif_email          boolean not null default true,
  notif_whatsapp       boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function set_updated_at();


-- ────────────────────────────────────────────────────────────
-- 4. HELPER — rôle de l'utilisateur courant (après profiles)
-- ────────────────────────────────────────────────────────────
create or replace function mon_role()
returns role_utilisateur language sql stable security definer as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function est_responsable()
returns boolean language sql stable security definer as $$
  select coalesce(
    (select role in ('responsable','super_admin')
     from public.profiles where id = auth.uid()),
    false
  );
$$;


-- 3.2 versets --------------------------------------------------
create table public.versets (
  id                uuid primary key default gen_random_uuid(),
  texte             text not null,
  reference         text not null,
  meditation        text,
  date_publication  date,
  created_by        uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger trg_versets_updated_at
  before update on public.versets
  for each row execute function set_updated_at();


-- 3.3 series ---------------------------------------------------
create table public.series (
  id          uuid primary key default gen_random_uuid(),
  titre       text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_series_updated_at
  before update on public.series
  for each row execute function set_updated_at();


-- 3.4 enseignements --------------------------------------------
create table public.enseignements (
  id           uuid primary key default gen_random_uuid(),
  titre        text not null,
  serie_id     uuid references public.series(id) on delete set null,
  intervenant  text,
  date         date,
  theme        text,
  texte        text,
  youtube_id   text,
  type         type_enseignement not null default 'texte',
  numero       integer,
  total_serie  integer,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger trg_enseignements_updated_at
  before update on public.enseignements
  for each row execute function set_updated_at();


-- 3.5 temoignages ----------------------------------------------
create table public.temoignages (
  id             uuid primary key default gen_random_uuid(),
  titre          text not null,
  contenu        text not null,
  categorie      text,
  auteur_id      uuid references public.profiles(id) on delete set null,
  anonyme        boolean not null default false,
  statut         statut_temoignage not null default 'en_attente',
  motif_refus    text,
  validated_at   timestamptz,
  validated_by   uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger trg_temoignages_updated_at
  before update on public.temoignages
  for each row execute function set_updated_at();


-- 3.6 prieres --------------------------------------------------
create table public.prieres (
  id              uuid primary key default gen_random_uuid(),
  sujet           text not null,
  details         text,
  categorie       text,
  auteur_id       uuid references public.profiles(id) on delete set null,
  anonyme         boolean not null default false,
  urgent          boolean not null default false,
  compteur_prie   integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger trg_prieres_updated_at
  before update on public.prieres
  for each row execute function set_updated_at();


-- 3.7 prie_par (jonction "je prie pour ce sujet") --------------
create table public.prie_par (
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  priere_id   uuid not null references public.prieres(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (profile_id, priere_id)
);


-- 3.8 annonces -------------------------------------------------
create table public.annonces (
  id               uuid primary key default gen_random_uuid(),
  titre            text not null,
  contenu          text,
  categorie        text,
  date_evenement   date,
  urgent           boolean not null default false,
  created_by       uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger trg_annonces_updated_at
  before update on public.annonces
  for each row execute function set_updated_at();


-- 3.9 ressources -----------------------------------------------
create table public.ressources (
  id          uuid primary key default gen_random_uuid(),
  titre       text not null,
  type        type_ressource not null,
  fichier_url text,
  categorie   text,
  taille      text,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_ressources_updated_at
  before update on public.ressources
  for each row execute function set_updated_at();


-- 3.10 livres --------------------------------------------------
create table public.livres (
  id              uuid primary key default gen_random_uuid(),
  titre           text not null,
  auteur          text,
  annee           integer,
  pages           integer,
  categorie       text,
  description     text,
  extrait         text,
  couverture_url  text,
  lien_acces      text,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger trg_livres_updated_at
  before update on public.livres
  for each row execute function set_updated_at();


-- 3.11 sorties -------------------------------------------------
create table public.sorties (
  id          uuid primary key default gen_random_uuid(),
  titre       text not null,
  date        date,
  heure       text,
  lieu        text,
  theme       text,
  programme   text,
  statut      statut_sortie not null default 'a_venir',
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_sorties_updated_at
  before update on public.sorties
  for each row execute function set_updated_at();


-- 3.12 rapports_sorties ----------------------------------------
create table public.rapports_sorties (
  id            uuid primary key default gen_random_uuid(),
  sortie_id     uuid not null references public.sorties(id) on delete cascade,
  resume        text,
  taille_equipe integer,
  contacts      integer,
  decisions     integer,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger trg_rapports_sorties_updated_at
  before update on public.rapports_sorties
  for each row execute function set_updated_at();


-- 3.13 ipb_programme -------------------------------------------
create table public.ipb_programme (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  titre       text not null,
  credits     integer,
  niveau      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_ipb_programme_updated_at
  before update on public.ipb_programme
  for each row execute function set_updated_at();


-- 3.14 ipb_cours -----------------------------------------------
create table public.ipb_cours (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique,
  titre           text not null,
  professeur      text,
  nombre_modules  integer,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger trg_ipb_cours_updated_at
  before update on public.ipb_cours
  for each row execute function set_updated_at();


-- 3.15 ipb_documents -------------------------------------------
create table public.ipb_documents (
  id          uuid primary key default gen_random_uuid(),
  cours_id    uuid not null references public.ipb_cours(id) on delete cascade,
  titre       text not null,
  fichier_url text,
  type        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_ipb_documents_updated_at
  before update on public.ipb_documents
  for each row execute function set_updated_at();


-- 3.16 ipb_inscriptions ----------------------------------------
create table public.ipb_inscriptions (
  id            uuid primary key default gen_random_uuid(),
  nom           text not null,
  email         text not null,
  telephone     text,
  niveau_vise   text,
  statut        statut_inscription not null default 'en_attente',
  motif_refus   text,
  profile_id    uuid references public.profiles(id) on delete set null,
  treated_at    timestamptz,
  treated_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger trg_ipb_inscriptions_updated_at
  before update on public.ipb_inscriptions
  for each row execute function set_updated_at();


-- 3.17 favoris -------------------------------------------------
create table public.favoris (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  contenu_type  text not null,
  contenu_id    uuid not null,
  created_at    timestamptz not null default now(),
  unique (profile_id, contenu_type, contenu_id)
);


-- ────────────────────────────────────────────────────────────
-- 5. TRIGGER — création automatique du profil à l'inscription
-- ────────────────────────────────────────────────────────────
-- Crée le profil applicatif à chaque inscription, quel que soit le fournisseur
-- (email/mot de passe comme OAuth). Les clés de métadonnées diffèrent selon la
-- provenance : 'nom_complet' est envoyée par notre formulaire de signup,
-- 'full_name'/'name' par Google. Cf. supabase/fix-google-oauth-profil.sql.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nom_complet)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'nom_complet'), ''),
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      new.email
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ────────────────────────────────────────────────────────────
-- 6. INDEX
-- ────────────────────────────────────────────────────────────
create index idx_enseignements_serie_id   on public.enseignements(serie_id);
create index idx_enseignements_created_at on public.enseignements(created_at desc);

create index idx_temoignages_statut       on public.temoignages(statut);
create index idx_temoignages_auteur_id    on public.temoignages(auteur_id);
create index idx_temoignages_created_at   on public.temoignages(created_at desc);

create index idx_prieres_auteur_id        on public.prieres(auteur_id);
create index idx_prieres_urgent           on public.prieres(urgent);
create index idx_prieres_created_at       on public.prieres(created_at desc);

create index idx_prie_par_priere_id       on public.prie_par(priere_id);

create index idx_annonces_created_at      on public.annonces(created_at desc);
create index idx_annonces_urgent          on public.annonces(urgent);

create index idx_sorties_statut           on public.sorties(statut);
create index idx_sorties_date             on public.sorties(date desc);

create index idx_rapports_sortie_id       on public.rapports_sorties(sortie_id);

create index idx_ipb_documents_cours_id   on public.ipb_documents(cours_id);

create index idx_ipb_inscriptions_statut  on public.ipb_inscriptions(statut);
create index idx_ipb_inscriptions_email   on public.ipb_inscriptions(email);

create index idx_favoris_profile_id       on public.favoris(profile_id);
create index idx_favoris_contenu          on public.favoris(contenu_type, contenu_id);


-- ────────────────────────────────────────────────────────────
-- 7. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

alter table public.profiles           enable row level security;
alter table public.versets             enable row level security;
alter table public.series              enable row level security;
alter table public.enseignements       enable row level security;
alter table public.temoignages         enable row level security;
alter table public.prieres             enable row level security;
alter table public.prie_par            enable row level security;
alter table public.annonces            enable row level security;
alter table public.ressources          enable row level security;
alter table public.livres              enable row level security;
alter table public.sorties             enable row level security;
alter table public.rapports_sorties    enable row level security;
alter table public.ipb_programme       enable row level security;
alter table public.ipb_cours           enable row level security;
alter table public.ipb_documents       enable row level security;
alter table public.ipb_inscriptions    enable row level security;
alter table public.favoris             enable row level security;


-- ────────────────────────────────────────────────────────────
-- 8. POLITIQUES RLS
-- ────────────────────────────────────────────────────────────

-- ── profiles ──────────────────────────────────────────────────
-- Chacun voit son propre profil ; les responsables voient tout
create policy "profiles: lecture proprio"
  on public.profiles for select
  using (id = auth.uid() or est_responsable());

create policy "profiles: mise à jour proprio"
  on public.profiles for update
  using (id = auth.uid());

create policy "profiles: admin peut tout modifier"
  on public.profiles for update
  using (est_responsable());


-- ── contenu public (lecture anonyme) ──────────────────────────
-- versets
create policy "versets: lecture publique"
  on public.versets for select using (true);

create policy "versets: écriture responsable"
  on public.versets for all
  using (est_responsable()) with check (est_responsable());

-- series
create policy "series: lecture publique"
  on public.series for select using (true);

create policy "series: écriture responsable"
  on public.series for all
  using (est_responsable()) with check (est_responsable());

-- enseignements
create policy "enseignements: lecture publique"
  on public.enseignements for select using (true);

create policy "enseignements: écriture responsable"
  on public.enseignements for all
  using (est_responsable()) with check (est_responsable());

-- annonces
create policy "annonces: lecture publique"
  on public.annonces for select using (true);

create policy "annonces: écriture responsable"
  on public.annonces for all
  using (est_responsable()) with check (est_responsable());

-- ressources
create policy "ressources: lecture publique"
  on public.ressources for select using (true);

create policy "ressources: écriture responsable"
  on public.ressources for all
  using (est_responsable()) with check (est_responsable());

-- livres
create policy "livres: lecture publique"
  on public.livres for select using (true);

create policy "livres: écriture responsable"
  on public.livres for all
  using (est_responsable()) with check (est_responsable());

-- sorties
create policy "sorties: lecture publique"
  on public.sorties for select using (true);

create policy "sorties: écriture responsable"
  on public.sorties for all
  using (est_responsable()) with check (est_responsable());

-- rapports_sorties
create policy "rapports: lecture publique"
  on public.rapports_sorties for select using (true);

create policy "rapports: écriture responsable"
  on public.rapports_sorties for all
  using (est_responsable()) with check (est_responsable());

-- ipb_programme
create policy "ipb_programme: lecture publique"
  on public.ipb_programme for select using (true);

create policy "ipb_programme: écriture responsable"
  on public.ipb_programme for all
  using (est_responsable()) with check (est_responsable());

-- ipb_cours
create policy "ipb_cours: lecture publique"
  on public.ipb_cours for select using (true);

create policy "ipb_cours: écriture responsable"
  on public.ipb_cours for all
  using (est_responsable()) with check (est_responsable());

-- ipb_documents
create policy "ipb_documents: lecture publique"
  on public.ipb_documents for select using (true);

create policy "ipb_documents: écriture responsable"
  on public.ipb_documents for all
  using (est_responsable()) with check (est_responsable());


-- ── temoignages ───────────────────────────────────────────────
-- Publiés → tout le monde ; en_attente → auteur + responsables
create policy "temoignages: lecture publié"
  on public.temoignages for select
  using (
    statut = 'publie'
    or auteur_id = auth.uid()
    or est_responsable()
  );

-- Un membre peut soumettre (INSERT) son propre témoignage
create policy "temoignages: soumission membre"
  on public.temoignages for insert
  with check (auteur_id = auth.uid());

-- Seuls les responsables peuvent valider / modifier / supprimer
create policy "temoignages: modération responsable"
  on public.temoignages for update
  using (est_responsable()) with check (est_responsable());

create policy "temoignages: suppression responsable"
  on public.temoignages for delete
  using (est_responsable());


-- ── prieres ───────────────────────────────────────────────────
-- Visibles par les utilisateurs connectés uniquement
create policy "prieres: lecture connecté"
  on public.prieres for select
  using (auth.uid() is not null);

create policy "prieres: soumission membre"
  on public.prieres for insert
  with check (auteur_id = auth.uid());

create policy "prieres: modification responsable"
  on public.prieres for update
  using (est_responsable()) with check (est_responsable());

create policy "prieres: suppression responsable"
  on public.prieres for delete
  using (est_responsable());


-- ── prie_par ──────────────────────────────────────────────────
create policy "prie_par: lecture proprio"
  on public.prie_par for select
  using (profile_id = auth.uid());

create policy "prie_par: insert proprio"
  on public.prie_par for insert
  with check (profile_id = auth.uid());

create policy "prie_par: delete proprio"
  on public.prie_par for delete
  using (profile_id = auth.uid());


-- ── ipb_inscriptions ──────────────────────────────────────────
-- Chacun voit sa propre inscription ; les responsables voient tout
create policy "inscriptions: lecture proprio ou responsable"
  on public.ipb_inscriptions for select
  using (profile_id = auth.uid() or est_responsable());

-- Tout le monde peut soumettre une inscription (même non connecté)
create policy "inscriptions: soumission publique"
  on public.ipb_inscriptions for insert
  with check (true);

create policy "inscriptions: traitement responsable"
  on public.ipb_inscriptions for update
  using (est_responsable()) with check (est_responsable());


-- ── favoris ───────────────────────────────────────────────────
create policy "favoris: lecture proprio"
  on public.favoris for select
  using (profile_id = auth.uid());

create policy "favoris: insert proprio"
  on public.favoris for insert
  with check (profile_id = auth.uid());

create policy "favoris: delete proprio"
  on public.favoris for delete
  using (profile_id = auth.uid());


-- ────────────────────────────────────────────────────────────
-- 7. FONCTION — profils enrichis de l'email (back-office)
-- ────────────────────────────────────────────────────────────
-- L'email n'est pas dans public.profiles mais dans auth.users.
-- Cette fonction `security definer` joint les deux et n'expose les
-- données qu'aux responsables / super_admins (garde est_responsable()).
create or replace function public.profils_avec_email()
returns table (
  id           uuid,
  nom_complet  text,
  email        text,
  role         role_utilisateur,
  etudiant_ipb boolean,
  created_at   timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.nom_complet, u.email::text, p.role, p.etudiant_ipb, p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where est_responsable()
$$;

grant execute on function public.profils_avec_email() to authenticated;
