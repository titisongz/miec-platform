import { supabase } from './supabase';
import DB from './data';
import type {
  Verse, Enseignement, Serie, Temoignage, Annonce,
  Priere, Ressource, Livre, Sortie, IPBCours, IPBProgramme, FavItem,
} from './types';

// ── Helpers date ──────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return 'il y a < 1 h';
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'hier';
  if (d < 7) return `il y a ${d} j`;
  return fmtDate(iso);
}

// ── Verset du jour ────────────────────────────────────────────────────────────

export async function getVerset(): Promise<Verse> {
  try {
    const today = new Date().toISOString().split('T')[0];

    let { data } = await supabase
      .from('versets')
      .select('texte, reference')
      .eq('date_publication', today)
      .limit(1)
      .maybeSingle();

    if (!data) {
      ({ data } = await supabase
        .from('versets')
        .select('texte, reference')
        .order('date_publication', { ascending: false })
        .limit(1)
        .maybeSingle());
    }

    if (!data) return DB.VERSES[0];
    return { t: data.texte, r: data.reference };
  } catch {
    return DB.VERSES[0];
  }
}

// ── Enseignements ─────────────────────────────────────────────────────────────

export async function getEnseignements(theme?: string): Promise<Enseignement[]> {
  try {
    let query = supabase
      .from('enseignements')
      .select(`
        id, titre, intervenant, date, youtube_id, type,
        numero, total_serie, theme, texte,
        serie:series(id, titre)
      `)
      .order('created_at', { ascending: false });

    if (theme) query = query.eq('theme', theme);

    const { data, error } = await query;
    if (error || !data?.length) return DB.ENSEIGNEMENTS;

    return data.map(e => ({
      id: e.id,
      serie: (e.serie as { titre?: string } | null)?.titre ?? '',
      titre: e.titre,
      auteur: e.intervenant ?? '',
      date: fmtDate(e.date),
      duree: '',
      type: e.type === 'video' ? 'video' : 'text',
      yt: e.youtube_id ?? undefined,
      theme: e.theme ?? '',
      n: e.numero ?? 1,
      total: e.total_serie ?? 1,
      excerpt: e.texte ? e.texte.slice(0, 200) : '',
      texte: e.texte ?? '',
    }));
  } catch {
    return DB.ENSEIGNEMENTS;
  }
}

// ── Séries ────────────────────────────────────────────────────────────────────

export async function getSeries(): Promise<Serie[]> {
  try {
    const { data, error } = await supabase
      .from('series')
      .select('id, titre')
      .order('created_at', { ascending: false });

    if (error || !data?.length) return DB.SERIES;

    const counts = await Promise.all(
      data.map(s =>
        supabase
          .from('enseignements')
          .select('id', { count: 'exact', head: true })
          .eq('serie_id', s.id)
          .then(({ count }) => ({ id: s.id, n: count ?? 0 }))
      )
    );
    const countMap = Object.fromEntries(counts.map(c => [c.id, c.n]));

    return data.map(s => {
      const n = countMap[s.id] ?? 0;
      return {
        id: s.id,
        titre: s.titre,
        n,
        c: '',
        meta: `${n} message${n > 1 ? 's' : ''}`,
      };
    });
  } catch {
    return DB.SERIES;
  }
}

// ── Témoignages ───────────────────────────────────────────────────────────────

export async function getTemoignages(categorie?: string): Promise<Temoignage[]> {
  try {
    let query = supabase
      .from('temoignages')
      .select(`
        id, titre, categorie, anonyme, statut, contenu, created_at,
        auteur:profiles!temoignages_auteur_id_fkey(nom_complet)
      `)
      .eq('statut', 'publie')
      .order('created_at', { ascending: false });

    if (categorie) query = query.eq('categorie', categorie);

    const { data, error } = await query;
    if (error || !data?.length) return DB.TEMOIGNAGES;

    return data.map(t => ({
      id: t.id,
      titre: t.titre,
      auteur: t.anonyme ? 'Anonyme' : ((t.auteur as { nom_complet?: string } | null)?.nom_complet ?? 'Anonyme'),
      date: fmtDate(t.created_at),
      cat: t.categorie ?? '',
      statut: t.statut,
      excerpt: t.contenu ? t.contenu.slice(0, 160) : '',
      full: t.contenu ?? '',
    }));
  } catch {
    return DB.TEMOIGNAGES;
  }
}

// ── Annonces ──────────────────────────────────────────────────────────────────

export async function getAnnonces(categorie?: string): Promise<Annonce[]> {
  try {
    let query = supabase
      .from('annonces')
      .select('*')
      .order('created_at', { ascending: false });

    if (categorie) query = query.eq('categorie', categorie);

    const { data, error } = await query;
    if (error || !data?.length) return DB.ANNONCES;

    return data.map(a => ({
      id: a.id,
      titre: a.titre,
      cat: a.categorie ?? '',
      date: fmtDate(a.date_evenement),
      urgent: a.urgent,
      excerpt: a.contenu ? a.contenu.slice(0, 160) : '',
      full: a.contenu ?? '',
      photos: a.photos ?? [],
    }));
  } catch {
    return DB.ANNONCES;
  }
}

// ── Prières (RLS : utilisateur connecté requis) ───────────────────────────────

export async function getPrieres(categorie?: string): Promise<Priere[]> {
  try {
    let query = supabase
      .from('prieres')
      .select(`
        id, sujet, categorie, anonyme, urgent, compteur_prie, details, created_at,
        auteur:profiles!prieres_auteur_id_fkey(nom_complet)
      `)
      .order('urgent', { ascending: false })
      .order('created_at', { ascending: false });

    if (categorie) query = query.eq('categorie', categorie);

    const { data, error } = await query;
    if (error || !data?.length) return DB.PRIERES;

    return data.map(p => ({
      id: p.id,
      sujet: p.sujet,
      auteur: p.anonyme ? 'Anonyme' : ((p.auteur as { nom_complet?: string } | null)?.nom_complet ?? 'Anonyme'),
      date: relativeDate(p.created_at),
      cat: p.categorie ?? '',
      prie: p.compteur_prie,
      urgent: p.urgent,
      full: p.details ?? '',
    }));
  } catch {
    return DB.PRIERES;
  }
}

// ── Ressources ────────────────────────────────────────────────────────────────

const FMT_MAP: Record<string, string> = {
  pdf: 'PDF', audio: 'Audio', partition: 'Partition', plan: 'Plan',
};

export async function getRessources(categorie?: string): Promise<Ressource[]> {
  try {
    let query = supabase
      .from('ressources')
      .select('*')
      .order('created_at', { ascending: false });

    if (categorie) query = query.eq('categorie', categorie);

    const { data, error } = await query;
    if (error || !data?.length) return DB.RESSOURCES;

    return data.map(r => ({
      id: r.id,
      titre: r.titre,
      type: r.type,
      fmt: FMT_MAP[r.type] ?? r.type,
      taille: r.taille ?? '',
      cat: r.categorie ?? '',
      date: fmtDate(r.created_at),
      photo: r.photo_url ?? undefined,
      fichier: r.fichier_url ?? undefined,
    }));
  } catch {
    return DB.RESSOURCES;
  }
}

// ── Livres ────────────────────────────────────────────────────────────────────

export async function getLivres(): Promise<Livre[]> {
  try {
    const { data, error } = await supabase
      .from('livres')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data?.length) return DB.LIVRES;

    return data.map(l => ({
      id: l.id,
      titre: l.titre,
      auteur: l.auteur ?? '',
      annee: l.annee ?? 0,
      pages: l.pages ?? 0,
      cat: l.categorie ?? '',
      desc: l.description ?? '',
      extrait: l.extrait ?? '',
      couverture: l.couverture_url ?? undefined,
      lien_acces: l.lien_acces ?? undefined,
    }));
  } catch {
    return DB.LIVRES;
  }
}

// ── Sorties ───────────────────────────────────────────────────────────────────

export async function getSorties(): Promise<Sortie[]> {
  try {
    const { data, error } = await supabase
      .from('sorties')
      .select('*, rapports:rapports_sorties(taille_equipe, contacts, decisions)')
      .order('date', { ascending: false });

    if (error || !data?.length) return DB.SORTIES;

    return data.map(s => {
      const rapport = (s.rapports as { taille_equipe?: number; contacts?: number; decisions?: number }[] | null)?.[0];
      return {
        id: s.id,
        titre: s.titre,
        date: fmtDate(s.date),
        heure: s.heure ?? '',
        statut: s.statut,
        theme: s.theme ?? '',
        equipe: rapport?.taille_equipe ?? 0,
        contacts: rapport?.contacts ?? undefined,
        decisions: rapport?.decisions ?? undefined,
        full: s.programme ?? '',
        photos: s.photos ?? [],
      };
    });
  } catch {
    return DB.SORTIES;
  }
}

// ── Rapport d'une sortie ──────────────────────────────────────────────────────

export async function getRapportSortie(sortie_id: string) {
  try {
    const { data, error } = await supabase
      .from('rapports_sorties')
      .select('*')
      .eq('sortie_id', sortie_id)
      .maybeSingle();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

// ── Participations aux sorties ────────────────────────────────────────────────
// Table participations_sorties créée par supabase/fix-participations-sorties.sql.

/** Nombre de participants inscrits à une sortie. */
export async function getParticipantsCount(sortie_id: string): Promise<number> {
  try {
    const { count } = await supabase
      .from('participations_sorties')
      .select('profile_id', { count: 'exact', head: true })
      .eq('sortie_id', sortie_id);
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** L'utilisateur participe-t-il déjà à cette sortie ? */
export async function getParticipation(sortie_id: string, profile_id: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('participations_sorties')
      .select('profile_id')
      .eq('sortie_id', sortie_id)
      .eq('profile_id', profile_id)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

/** Inscrit / désinscrit l'utilisateur de la sortie (selon l'état actuel en base). */
export async function toggleParticipation(sortie_id: string, profile_id: string): Promise<void> {
  const exists = await getParticipation(sortie_id, profile_id);
  if (exists) {
    await supabase.from('participations_sorties').delete().match({ sortie_id, profile_id });
  } else {
    await supabase.from('participations_sorties').insert({ sortie_id, profile_id });
  }
}

// ── IPB — Programme académique ────────────────────────────────────────────────

export async function getIPBProgramme(): Promise<IPBProgramme[]> {
  try {
    const { data, error } = await supabase
      .from('ipb_programme')
      .select('code, titre, credits, niveau')
      .order('niveau')
      .order('code');

    if (error || !data?.length) return DB.IPB_PROGRAMME;

    return data.map(p => ({
      code: p.code,
      titre: p.titre,
      credits: p.credits ?? 0,
      niveau: p.niveau ?? '',
    }));
  } catch {
    return DB.IPB_PROGRAMME;
  }
}

// ── IPB — Cours (RLS : étudiant connecté) ────────────────────────────────────

export async function getIPBCours(): Promise<IPBCours[]> {
  try {
    // select('*') = résilient si niveau/description n'existent pas encore.
    const { data, error } = await supabase
      .from('ipb_cours')
      .select('*, docs:ipb_documents(titre, type, fichier_url)')
      .order('code');

    if (error || !data?.length) return DB.IPB_COURS;

    return data.map(c => ({
      id: c.id,
      code: c.code,
      titre: c.titre,
      prof: c.professeur ?? '',
      prog: 0,
      modules: c.nombre_modules ?? 0,
      fait: 0,
      docs: ((c.docs as { titre: string; type?: string; fichier_url?: string }[]) ?? []).map(d => ({
        t: d.titre,
        f: d.type ?? '',
        url: d.fichier_url ?? undefined,
      })),
      niveau: c.niveau ?? '',
      desc: c.description ?? '',
    }));
  } catch {
    return DB.IPB_COURS;
  }
}

// ── IPB — Vitrine (contenu éditable, modèle clé/valeur) ──────────────────────

// Valeurs par défaut = contenu historiquement codé en dur sur la page vitrine.
// Sert de repli tant que le script supabase/fix-ipb-vitrine.sql n'a pas été
// exécuté (table absente / vide), et garantit un objet complet même si la base
// ne renvoie qu'une partie des clés.
export const IPB_VITRINE_DEFAUT: Record<string, string> = {
  description:       'Bâtir la vie de Christ dans les vases de terre',
  depuis:            'Formation accélérée',
  cursus:            '2 mois',
  diplome:           'Attestation de formation',
  modalite:          'Présentiel · Tous les samedis',
  frais:             '10 000 FCFA',
  frais_note:        'Paiement OM : 658 923 857',
  date_inscriptions: '27 juin 2026',
  date_cloture:      '29 août 2026',
  date_rentree:      '27 juin 2026',
  condition_1:       'Être né de nouveau et recommandé par son église',
  condition_2:       'Cours tous les samedis de 09h à 11h30',
  condition_3:       'Durée 2 mois — du 27 juin au 29 août 2026',
  // Médias (clés ajoutées par supabase/update-ipb-vitrine.sql)
  banniere_url:      '',
  photos_galerie:    '[]',
};

/** Parse le JSON de `photos_galerie` en tableau d'URLs (tolérant aux valeurs invalides). */
export function parseGalerie(json: string | undefined | null): string[] {
  if (!json) return [];
  try {
    const arr: unknown = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((u): u is string => typeof u === 'string') : [];
  } catch {
    return [];
  }
}

/** Toutes les clés de la vitrine IPB sous forme d'objet { cle: valeur }. */
export async function getIPBVitrine(): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabase
      .from('ipb_vitrine')
      .select('cle, valeur');

    if (error || !data?.length) return { ...IPB_VITRINE_DEFAUT };

    const vitrine = { ...IPB_VITRINE_DEFAUT };
    for (const row of data) {
      if (row.valeur != null) vitrine[row.cle] = row.valeur;
    }
    return vitrine;
  } catch {
    return { ...IPB_VITRINE_DEFAUT };
  }
}

// ── Favoris ───────────────────────────────────────────────────────────────────

export async function getFavoris(profile_id: string): Promise<FavItem[]> {
  try {
    const { data, error } = await supabase
      .from('favoris')
      .select('id, contenu_type, contenu_id, created_at')
      .eq('profile_id', profile_id)
      .order('created_at', { ascending: false });

    if (error || !data?.length) return [];

    return data.map(f => ({
      type: f.contenu_type as import('./types').DetailType,
      id: f.contenu_id,
      item: { id: f.contenu_id },
      title: '',
      label: f.contenu_type,
      accent: 'slate' as import('./types').AccentKey,
      icon: 'bookmark',
    }));
  } catch {
    return [];
  }
}

// ── Favoris — écriture ───────────────────────────────────────────────────────

export async function addFavori(userId: string, type: string, itemId: string): Promise<void> {
  try {
    await supabase
      .from('favoris')
      .upsert({ profile_id: userId, contenu_type: type, contenu_id: itemId });
  } catch { /* silent */ }
}

export async function removeFavori(userId: string, type: string, itemId: string): Promise<void> {
  try {
    await supabase
      .from('favoris')
      .delete()
      .match({ profile_id: userId, contenu_type: type, contenu_id: itemId });
  } catch { /* silent */ }
}

// ── Recherche Supabase ────────────────────────────────────────────────────────

/** Nettoie le terme : retire les caractères qui cassent le filtre `.or()` de PostgREST. */
function sanitizeTerm(q: string): string {
  return q.trim().replace(/[,()%*]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Construit une clause `.or()` insensible à la casse sur plusieurs colonnes. */
function ilikeOr(term: string, cols: string[]): string {
  return cols.map(c => `${c}.ilike.%${term}%`).join(',');
}

export async function searchEnseignements(query: string): Promise<Enseignement[]> {
  const term = sanitizeTerm(query);
  if (!term) return [];
  try {
    const { data, error } = await supabase
      .from('enseignements')
      .select(`
        id, titre, intervenant, date, youtube_id, type,
        numero, total_serie, theme, texte,
        serie:series(id, titre)
      `)
      .or(ilikeOr(term, ['titre', 'intervenant', 'theme']))
      .order('created_at', { ascending: false })
      .limit(30);

    if (error || !data) return [];

    return data.map(e => ({
      id: e.id,
      serie: (e.serie as { titre?: string } | null)?.titre ?? '',
      titre: e.titre,
      auteur: e.intervenant ?? '',
      date: fmtDate(e.date),
      duree: '',
      type: e.type === 'video' ? 'video' : 'text',
      yt: e.youtube_id ?? undefined,
      theme: e.theme ?? '',
      n: e.numero ?? 1,
      total: e.total_serie ?? 1,
      excerpt: e.texte ? e.texte.slice(0, 200) : '',
    }));
  } catch {
    return [];
  }
}

export async function searchTemoignages(query: string): Promise<Temoignage[]> {
  const term = sanitizeTerm(query);
  if (!term) return [];
  try {
    const { data, error } = await supabase
      .from('temoignages')
      .select(`
        id, titre, categorie, anonyme, statut, contenu, created_at,
        auteur:profiles!temoignages_auteur_id_fkey(nom_complet)
      `)
      .eq('statut', 'publie')
      .or(ilikeOr(term, ['titre', 'contenu', 'categorie']))
      .order('created_at', { ascending: false })
      .limit(30);

    if (error || !data) return [];

    return data.map(t => ({
      id: t.id,
      titre: t.titre,
      auteur: t.anonyme ? 'Anonyme' : ((t.auteur as { nom_complet?: string } | null)?.nom_complet ?? 'Anonyme'),
      date: fmtDate(t.created_at),
      cat: t.categorie ?? '',
      statut: t.statut,
      excerpt: t.contenu ? t.contenu.slice(0, 160) : '',
      full: t.contenu ?? '',
    }));
  } catch {
    return [];
  }
}

export async function searchAnnonces(query: string): Promise<Annonce[]> {
  const term = sanitizeTerm(query);
  if (!term) return [];
  try {
    const { data, error } = await supabase
      .from('annonces')
      .select('id, titre, categorie, date_evenement, urgent, contenu')
      .or(ilikeOr(term, ['titre', 'contenu', 'categorie']))
      .order('created_at', { ascending: false })
      .limit(30);

    if (error || !data) return [];

    return data.map(a => ({
      id: a.id,
      titre: a.titre,
      cat: a.categorie ?? '',
      date: fmtDate(a.date_evenement),
      urgent: a.urgent,
      excerpt: a.contenu ? a.contenu.slice(0, 160) : '',
      full: a.contenu ?? '',
    }));
  } catch {
    return [];
  }
}

export async function searchRessources(query: string): Promise<Ressource[]> {
  const term = sanitizeTerm(query);
  if (!term) return [];
  try {
    const { data, error } = await supabase
      .from('ressources')
      .select('id, titre, type, taille, categorie, created_at, fichier_url, photo_url')
      .or(ilikeOr(term, ['titre', 'categorie']))
      .order('created_at', { ascending: false })
      .limit(30);

    if (error || !data) return [];

    return data.map(r => ({
      id: r.id,
      titre: r.titre,
      type: r.type,
      fmt: FMT_MAP[r.type] ?? r.type,
      taille: r.taille ?? '',
      cat: r.categorie ?? '',
      date: fmtDate(r.created_at),
      photo: r.photo_url ?? undefined,
      fichier: r.fichier_url ?? undefined,
    }));
  } catch {
    return [];
  }
}

export async function searchLivres(query: string): Promise<Livre[]> {
  const term = sanitizeTerm(query);
  if (!term) return [];
  try {
    const { data, error } = await supabase
      .from('livres')
      .select('id, titre, auteur, annee, pages, categorie, description, extrait, couverture_url, lien_acces')
      .or(ilikeOr(term, ['titre', 'auteur', 'description']))
      .order('created_at', { ascending: false })
      .limit(30);

    if (error || !data) return [];

    return data.map(l => ({
      id: l.id,
      titre: l.titre,
      auteur: l.auteur ?? '',
      annee: l.annee ?? 0,
      pages: l.pages ?? 0,
      cat: l.categorie ?? '',
      desc: l.description ?? '',
      extrait: l.extrait ?? '',
      couverture: l.couverture_url ?? undefined,
      lien_acces: l.lien_acces ?? undefined,
    }));
  } catch {
    return [];
  }
}

export async function searchSorties(query: string): Promise<Sortie[]> {
  const term = sanitizeTerm(query);
  if (!term) return [];
  try {
    const { data, error } = await supabase
      .from('sorties')
      .select(`
        id, titre, date, heure, statut, theme, programme, photos,
        rapports:rapports_sorties(taille_equipe, contacts, decisions)
      `)
      .or(ilikeOr(term, ['titre', 'theme', 'lieu']))
      .order('date', { ascending: false })
      .limit(30);

    if (error || !data) return [];

    return data.map(s => {
      const rapport = (s.rapports as { taille_equipe?: number; contacts?: number; decisions?: number }[] | null)?.[0];
      return {
        id: s.id,
        titre: s.titre,
        date: fmtDate(s.date),
        heure: s.heure ?? '',
        statut: s.statut,
        theme: s.theme ?? '',
        equipe: rapport?.taille_equipe ?? 0,
        contacts: rapport?.contacts ?? undefined,
        decisions: rapport?.decisions ?? undefined,
        full: s.programme ?? '',
        photos: s.photos ?? [],
      };
    });
  } catch {
    return [];
  }
}

// ── Recherche globale ─────────────────────────────────────────────────────────

export type SearchType =
  | 'enseignement' | 'temoignage' | 'annonce' | 'priere'
  | 'ressource' | 'livre' | 'sortie' | 'ipb';

export interface SearchHit {
  type: SearchType;
  id: string;
  title: string;
  subtitle: string;
  item: unknown;
}

export interface SearchGroup {
  type: SearchType;
  label: string;
  hits: SearchHit[];
}

export interface GlobalSearchResult {
  total: number;
  groups: SearchGroup[];
}

const SEARCH_LABELS: Record<SearchType, string> = {
  enseignement: 'Enseignements',
  temoignage: 'Témoignages',
  annonce: 'Annonces',
  priere: 'Prières',
  ressource: 'Ressources',
  livre: 'Librairie',
  sortie: 'Évangélisation',
  ipb: 'Institut Biblique',
};

async function searchPrieresHits(term: string): Promise<SearchHit[]> {
  try {
    const { data, error } = await supabase
      .from('prieres')
      .select(`
        id, sujet, categorie, anonyme, urgent, compteur_prie, details, created_at,
        auteur:profiles!prieres_auteur_id_fkey(nom_complet)
      `)
      .or(ilikeOr(term, ['sujet', 'details']))
      .order('created_at', { ascending: false })
      .limit(5);

    if (error || !data) return [];

    return data.map(p => ({
      type: 'priere' as const,
      id: p.id,
      title: p.sujet,
      subtitle: p.categorie ?? '',
      item: {
        id: p.id,
        sujet: p.sujet,
        auteur: p.anonyme ? 'Anonyme' : ((p.auteur as { nom_complet?: string } | null)?.nom_complet ?? 'Anonyme'),
        date: relativeDate(p.created_at),
        cat: p.categorie ?? '',
        prie: p.compteur_prie,
        urgent: p.urgent,
        full: p.details ?? '',
      } as Priere,
    }));
  } catch {
    return [];
  }
}

async function searchIPBHits(term: string): Promise<SearchHit[]> {
  try {
    const { data, error } = await supabase
      .from('ipb_programme')
      .select('id, code, titre, credits, niveau')
      .or(ilikeOr(term, ['titre', 'code']))
      .limit(5);

    if (error || !data) return [];

    return data.map(p => ({
      type: 'ipb' as const,
      id: (p.id as string) ?? p.code,
      title: p.titre,
      subtitle: [p.code, p.niveau].filter(Boolean).join(' · '),
      item: { code: p.code, titre: p.titre, credits: p.credits ?? 0, niveau: p.niveau ?? '' } as IPBProgramme,
    }));
  } catch {
    return [];
  }
}

/**
 * Recherche simultanée dans toutes les tables de la plateforme.
 * Retourne les résultats groupés par type, max 5 par catégorie.
 */
export async function globalSearch(query: string): Promise<GlobalSearchResult> {
  const term = sanitizeTerm(query);
  if (!term) return { total: 0, groups: [] };

  const [ens, tem, ann, pri, res, liv, sor, ipb] = await Promise.all([
    searchEnseignements(term),
    searchTemoignages(term),
    searchAnnonces(term),
    searchPrieresHits(term),
    searchRessources(term),
    searchLivres(term),
    searchSorties(term),
    searchIPBHits(term),
  ]);

  const groups: SearchGroup[] = [
    {
      type: 'enseignement' as const,
      label: SEARCH_LABELS.enseignement,
      hits: ens.slice(0, 5).map(e => ({ type: 'enseignement' as const, id: e.id, title: e.titre, subtitle: [e.serie, e.auteur].filter(Boolean).join(' · '), item: e })),
    },
    {
      type: 'temoignage' as const,
      label: SEARCH_LABELS.temoignage,
      hits: tem.slice(0, 5).map(t => ({ type: 'temoignage' as const, id: t.id, title: t.titre, subtitle: [t.cat, t.auteur].filter(Boolean).join(' · '), item: t })),
    },
    {
      type: 'annonce' as const,
      label: SEARCH_LABELS.annonce,
      hits: ann.slice(0, 5).map(a => ({ type: 'annonce' as const, id: a.id, title: a.titre, subtitle: a.cat, item: a })),
    },
    { type: 'priere' as const, label: SEARCH_LABELS.priere, hits: pri },
    {
      type: 'ressource' as const,
      label: SEARCH_LABELS.ressource,
      hits: res.slice(0, 5).map(r => ({ type: 'ressource' as const, id: r.id, title: r.titre, subtitle: [r.cat, r.fmt].filter(Boolean).join(' · '), item: r })),
    },
    {
      type: 'livre' as const,
      label: SEARCH_LABELS.livre,
      hits: liv.slice(0, 5).map(b => ({ type: 'livre' as const, id: b.id, title: b.titre, subtitle: b.auteur, item: b })),
    },
    {
      type: 'sortie' as const,
      label: SEARCH_LABELS.sortie,
      hits: sor.slice(0, 5).map(s => ({ type: 'sortie' as const, id: s.id, title: s.titre, subtitle: s.theme, item: s })),
    },
    { type: 'ipb' as const, label: SEARCH_LABELS.ipb, hits: ipb },
  ].filter(g => g.hits.length > 0);

  const total = groups.reduce((sum, g) => sum + g.hits.length, 0);
  return { total, groups };
}

// ── Activité récente — page d'accueil ─────────────────────────────────────────

export async function getActivityRecente(): Promise<typeof DB.ACTIVITY> {
  const [ensRes, annRes, temRes, sorRes] = await Promise.allSettled([
    getEnseignements(),
    getAnnonces(),
    getTemoignages(),
    getSorties(),
  ]);

  return {
    enseignement:
      ensRes.status === 'fulfilled' && ensRes.value[0]
        ? ensRes.value[0]
        : DB.ACTIVITY.enseignement,
    annonce:
      annRes.status === 'fulfilled' && annRes.value[0]
        ? annRes.value[0]
        : DB.ACTIVITY.annonce,
    temoignage:
      temRes.status === 'fulfilled' && temRes.value[0]
        ? temRes.value[0]
        : DB.ACTIVITY.temoignage,
    sortie:
      sorRes.status === 'fulfilled' && sorRes.value.length
        ? (sorRes.value.find(s => s.statut === 'a_venir') ?? sorRes.value[0])
        : DB.ACTIVITY.sortie,
    ipb: DB.ACTIVITY.ipb,
  };
}

// ── Compteurs par module (tuiles de l'accueil) ────────────────────────────────
// Nombre réel d'éléments par catégorie (count exact, head: true → aucune donnée
// transférée). Le RLS s'applique : un visiteur ne compte que ce qui lui est
// visible (témoignages publiés, etc.).
const MODULE_TABLES: Record<string, string> = {
  enseignements: 'enseignements',
  priere:        'prieres',
  temoignages:   'temoignages',
  evangelisation:'sorties',
  annonces:      'annonces',
  ipb:           'ipb_cours',
  ressources:    'ressources',
  librairie:     'livres',
};

export async function getModuleCounts(): Promise<Record<string, number>> {
  const keys = Object.keys(MODULE_TABLES);
  const results = await Promise.allSettled(
    keys.map(k => supabase.from(MODULE_TABLES[k]).select('id', { count: 'exact', head: true })),
  );
  const counts: Record<string, number> = {};
  keys.forEach((k, i) => {
    const r = results[i];
    counts[k] = r.status === 'fulfilled' ? (r.value.count ?? 0) : 0;
  });
  return counts;
}
