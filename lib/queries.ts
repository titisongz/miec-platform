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
        auteur:profiles(nom_complet)
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
      .select('id, titre, categorie, date_evenement, urgent, contenu')
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
        auteur:profiles(nom_complet)
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
      .select('id, titre, type, taille, categorie, created_at')
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
      .select('id, titre, auteur, annee, pages, categorie, description, extrait')
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
      .select(`
        id, titre, date, heure, statut, theme, programme,
        rapports:rapports_sorties(taille_equipe, contacts, decisions)
      `)
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
    const { data, error } = await supabase
      .from('ipb_cours')
      .select(`
        id, code, titre, professeur, nombre_modules,
        docs:ipb_documents(titre, type)
      `)
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
      docs: ((c.docs as { titre: string; type?: string }[]) ?? []).map(d => ({
        t: d.titre,
        f: d.type ?? '',
      })),
    }));
  } catch {
    return DB.IPB_COURS;
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
