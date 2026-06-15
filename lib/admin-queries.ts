import { supabase } from './supabase';
import type { PostgrestError } from '@supabase/supabase-js';
import type { Enseignement, Serie, Annonce, Sortie } from './types';

// ── Helpers communs ───────────────────────────────────────────────────────────

// Journalise l'erreur Supabase EXACTE (message + code + details + hint) puis la
// relance. `never` indique à TypeScript que l'appel interrompt le flux, ce qui
// permet d'écrire `if (error) failSupabase(...)` et de narrower `error` à null.
function failSupabase(ctx: string, error: PostgrestError): never {
  console.error(`[admin-queries] ${ctx} — échec Supabase:`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
  throw error;
}

// UUID de l'utilisateur connecté (= profiles.id = auth.uid()), pour created_by.
// getSession() est local (pas d'aller-retour réseau).
async function authorId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user.id ?? null;
}

// Log non bloquant (les loaders renvoient [] plutôt que de jeter, pour ne pas
// figer la page d'admin sur l'état « chargement »).
function logSupabaseError(ctx: string, error: PostgrestError): void {
  console.error(`[admin-queries] ${ctx} — échec Supabase:`, {
    message: error.message, code: error.code, details: error.details, hint: error.hint,
  });
}

// ── Loaders ADMIN — données RÉELLES uniquement ────────────────────────────────
// Le back-office ne doit JAMAIS afficher les données de démonstration : leurs
// ids ('e1', 's1', 'a1'…) ne sont pas des UUID et font échouer delete/update
// (« invalid input syntax for type uuid »). Donc pas de repli mock, et les dates
// sont renvoyées BRUTES (ISO 'YYYY-MM-DD') pour alimenter les <input type="date">.

export async function getEnseignementsAdmin(): Promise<Enseignement[]> {
  const { data, error } = await supabase
    .from('enseignements')
    .select(`id, titre, intervenant, date, youtube_id, type, numero, total_serie, theme, texte, serie:series(id, titre)`)
    .order('created_at', { ascending: false });
  if (error) { logSupabaseError('getEnseignementsAdmin', error); return []; }
  return (data ?? []).map(e => ({
    id: e.id,
    serie: (e.serie as { titre?: string } | null)?.titre ?? '',
    titre: e.titre,
    auteur: e.intervenant ?? '',
    date: e.date ?? '',
    duree: '',
    type: e.type === 'video' ? 'video' : 'texte',
    yt: e.youtube_id ?? undefined,
    theme: e.theme ?? '',
    n: e.numero ?? 1,
    total: e.total_serie ?? 1,
    excerpt: e.texte ? e.texte.slice(0, 200) : '',
    texte: e.texte ?? '',
  }));
}

export async function getSeriesAdmin(): Promise<Serie[]> {
  const { data, error } = await supabase
    .from('series')
    .select('id, titre')
    .order('created_at', { ascending: false });
  if (error) { logSupabaseError('getSeriesAdmin', error); return []; }
  return (data ?? []).map(s => ({ id: s.id, titre: s.titre, n: 0, c: '', meta: '' }));
}

export async function getAnnoncesAdmin(): Promise<Annonce[]> {
  // select('*') = résilient si la colonne `photos` n'a pas encore été ajoutée.
  const { data, error } = await supabase
    .from('annonces')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { logSupabaseError('getAnnoncesAdmin', error); return []; }
  return (data ?? []).map(a => ({
    id: a.id,
    titre: a.titre,
    cat: a.categorie ?? '',
    date: a.date_evenement ?? '',
    urgent: a.urgent,
    excerpt: a.contenu ? a.contenu.slice(0, 160) : '',
    full: a.contenu ?? '',
    photos: a.photos ?? [],
  }));
}

export async function getSortiesAdmin(): Promise<Sortie[]> {
  const { data, error } = await supabase
    .from('sorties')
    .select('*, rapports:rapports_sorties(taille_equipe, contacts, decisions)')
    .order('date', { ascending: false });
  if (error) { logSupabaseError('getSortiesAdmin', error); return []; }
  return (data ?? []).map(s => {
    const rapport = (s.rapports as { taille_equipe?: number; contacts?: number; decisions?: number }[] | null)?.[0];
    return {
      id: s.id,
      titre: s.titre,
      date: s.date ?? '',
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
}

// ── Verset du jour ────────────────────────────────────────────────────────────

export async function upsertVerset(texte: string, reference: string, medit?: string) {
  const today = new Date().toISOString().split('T')[0];

  // Pas de contrainte UNIQUE sur date_publication → on ne peut pas utiliser
  // .upsert({ onConflict: 'date_publication' }) (sinon erreur Postgres 42P10).
  // On cherche donc le verset déjà publié aujourd'hui, puis update ou insert.
  const { data: existing, error: selErr } = await supabase
    .from('versets')
    .select('id')
    .eq('date_publication', today)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (selErr) failSupabase('upsertVerset (select)', selErr);

  if (existing) {
    const { error } = await supabase
      .from('versets')
      .update({ texte, reference, meditation: medit ?? null })
      .eq('id', existing.id);
    if (error) failSupabase('upsertVerset (update)', error);
  } else {
    const { error } = await supabase
      .from('versets')
      .insert({ texte, reference, meditation: medit ?? null, date_publication: today, created_by: await authorId() });
    if (error) failSupabase('upsertVerset (insert)', error);
  }
}

// ── Enseignements ─────────────────────────────────────────────────────────────

export async function createEnseignement(data: {
  titre: string; auteur: string; date: string; serie_id?: string;
  theme?: string; youtube_id?: string; texte?: string; type?: string;
}) {
  const { error } = await supabase.from('enseignements').insert({
    titre: data.titre, intervenant: data.auteur,
    date: data.date || null, serie_id: data.serie_id || null,
    theme: data.theme || null, youtube_id: data.youtube_id || null,
    // enum type_enseignement = ('video','texte') — surtout PAS 'text'.
    texte: data.texte || null, type: data.type || 'texte',
    created_by: await authorId(),
  });
  if (error) failSupabase('createEnseignement', error);
}

export async function updateEnseignement(id: string, data: Partial<{
  titre: string; auteur: string; date: string; serie_id: string;
  theme: string; youtube_id: string; texte: string; type: string;
}>) {
  const patch: Record<string, unknown> = {};
  if (data.titre) patch.titre = data.titre;
  if (data.auteur) patch.intervenant = data.auteur;
  if (data.date !== undefined) patch.date = data.date || null;
  if (data.serie_id !== undefined) patch.serie_id = data.serie_id || null;
  if (data.theme !== undefined) patch.theme = data.theme || null;
  if (data.youtube_id !== undefined) patch.youtube_id = data.youtube_id || null;
  if (data.texte !== undefined) patch.texte = data.texte || null;
  if (data.type) patch.type = data.type;
  const { error } = await supabase.from('enseignements').update(patch).eq('id', id);
  if (error) failSupabase('updateEnseignement', error);
}

export async function deleteEnseignement(id: string) {
  const { error } = await supabase.from('enseignements').delete().eq('id', id);
  if (error) failSupabase('deleteEnseignement', error);
}

// ── Séries ────────────────────────────────────────────────────────────────────

export async function createSerie(titre: string): Promise<string> {
  const { data, error } = await supabase.from('series').insert({ titre }).select('id').single();
  if (error) failSupabase('createSerie', error);
  return data.id;
}

// ── Témoignages — admin ───────────────────────────────────────────────────────

export async function getPendingTemoignages() {
  const { data, error } = await supabase
    .from('temoignages')
    .select(`id, titre, categorie, anonyme, contenu, created_at, auteur:profiles!temoignages_auteur_id_fkey(nom_complet)`)
    .eq('statut', 'en_attente')
    .order('created_at', { ascending: false });
  if (error) failSupabase('getPendingTemoignages', error);
  return (data ?? []).map(t => ({
    id: t.id,
    titre: t.titre,
    auteur: t.anonyme ? 'Anonyme' : ((t.auteur as { nom_complet?: string } | null)?.nom_complet ?? 'Anonyme'),
    date: relDate(t.created_at),
    cat: t.categorie ?? '',
    full: t.contenu ?? '',
  }));
}

export async function approveTemoignage(id: string) {
  const { error } = await supabase.from('temoignages').update({ statut: 'publie' }).eq('id', id);
  if (error) failSupabase('approveTemoignage', error);
}

export async function unpublishTemoignage(id: string) {
  const { error } = await supabase.from('temoignages').update({ statut: 'en_attente' }).eq('id', id);
  if (error) failSupabase('unpublishTemoignage', error);
}

export async function deleteTemoignage(id: string) {
  const { error } = await supabase.from('temoignages').delete().eq('id', id);
  if (error) failSupabase('deleteTemoignage', error);
}

// ── Annonces ──────────────────────────────────────────────────────────────────

export async function createAnnonce(data: { titre: string; cat: string; date: string; full: string; photos?: string[] }) {
  const { error } = await supabase.from('annonces').insert({
    titre: data.titre, categorie: data.cat,
    date_evenement: data.date || null, contenu: data.full,
    ...(data.photos?.length ? { photos: data.photos } : {}),
    created_by: await authorId(),
  });
  if (error) failSupabase('createAnnonce', error);
}

export async function updateAnnonce(id: string, data: { titre: string; cat: string; date: string; full: string; photos?: string[] }) {
  const { error } = await supabase.from('annonces').update({
    titre: data.titre, categorie: data.cat,
    date_evenement: data.date || null, contenu: data.full,
    ...(data.photos?.length ? { photos: data.photos } : {}),
  }).eq('id', id);
  if (error) failSupabase('updateAnnonce', error);
}

export async function deleteAnnonce(id: string) {
  const { error } = await supabase.from('annonces').delete().eq('id', id);
  if (error) failSupabase('deleteAnnonce', error);
}

// ── Prières ───────────────────────────────────────────────────────────────────

export async function deletePriere(id: string) {
  const { error } = await supabase.from('prieres').delete().eq('id', id);
  if (error) failSupabase('deletePriere', error);
}

// ── Ressources ────────────────────────────────────────────────────────────────

export async function createRessource(data: { titre: string; type: string; cat: string; desc?: string; taille?: string; photo?: string; fichier?: string }) {
  const { error } = await supabase.from('ressources').insert({
    titre: data.titre, type: data.type, categorie: data.cat,
    taille: data.taille || null, created_by: await authorId(),
    ...(data.desc ? { description: data.desc } : {}),
    ...(data.photo ? { photo_url: data.photo } : {}),
    ...(data.fichier ? { fichier_url: data.fichier } : {}),
  });
  if (error) failSupabase('createRessource', error);
}

export async function updateRessource(id: string, data: { titre: string; type: string; cat: string; desc?: string; photo?: string; fichier?: string }) {
  const { error } = await supabase.from('ressources').update({
    titre: data.titre, type: data.type, categorie: data.cat,
    ...(data.desc ? { description: data.desc } : {}),
    ...(data.photo ? { photo_url: data.photo } : {}),
    ...(data.fichier !== undefined ? { fichier_url: data.fichier || null } : {}),
  }).eq('id', id);
  if (error) failSupabase('updateRessource', error);
}

export async function deleteRessource(id: string) {
  const { error } = await supabase.from('ressources').delete().eq('id', id);
  if (error) failSupabase('deleteRessource', error);
}

// ── Livres ────────────────────────────────────────────────────────────────────

export async function createLivre(data: { titre: string; auteur: string; annee?: number; pages?: number; cat: string; desc?: string; extrait?: string; couverture?: string; lien?: string }) {
  const { error } = await supabase.from('livres').insert({
    titre: data.titre, auteur: data.auteur,
    annee: data.annee || null, pages: data.pages || null,
    categorie: data.cat, description: data.desc || null,
    extrait: data.extrait || null, couverture_url: data.couverture || null,
    lien_acces: data.lien || null,
    created_by: await authorId(),
  });
  if (error) failSupabase('createLivre', error);
}

export async function updateLivre(id: string, data: { titre: string; auteur: string; annee?: number; pages?: number; cat: string; desc?: string; extrait?: string; couverture?: string; lien?: string }) {
  const { error } = await supabase.from('livres').update({
    titre: data.titre, auteur: data.auteur,
    annee: data.annee || null, pages: data.pages || null,
    categorie: data.cat, description: data.desc || null,
    extrait: data.extrait || null,
    ...(data.couverture !== undefined ? { couverture_url: data.couverture || null } : {}),
    ...(data.lien !== undefined ? { lien_acces: data.lien || null } : {}),
  }).eq('id', id);
  if (error) failSupabase('updateLivre', error);
}

export async function deleteLivre(id: string) {
  const { error } = await supabase.from('livres').delete().eq('id', id);
  if (error) failSupabase('deleteLivre', error);
}

// ── Sorties ───────────────────────────────────────────────────────────────────

export async function createSortie(data: { titre: string; date: string; heure?: string; equipe?: number; theme?: string; programme?: string; photos?: string[] }) {
  const { error } = await supabase.from('sorties').insert({
    titre: data.titre, date: data.date || null,
    heure: data.heure || null, theme: data.theme || null,
    programme: data.programme || null, statut: 'a_venir',
    // `photos` n'est inclus que s'il y en a (sinon insert OK même avant le SQL).
    ...(data.photos?.length ? { photos: data.photos } : {}),
    created_by: await authorId(),
  });
  if (error) failSupabase('createSortie', error);
}

export async function updateSortie(id: string, data: { titre: string; date: string; heure?: string; equipe?: number; theme?: string; programme?: string; photos?: string[] }) {
  const { error } = await supabase.from('sorties').update({
    titre: data.titre, date: data.date || null,
    heure: data.heure || null, theme: data.theme || null,
    programme: data.programme || null,
    ...(data.photos?.length ? { photos: data.photos } : {}),
  }).eq('id', id);
  if (error) failSupabase('updateSortie', error);
}

export async function deleteSortie(id: string) {
  const { error } = await supabase.from('sorties').delete().eq('id', id);
  if (error) failSupabase('deleteSortie', error);
}

export async function upsertRapportSortie(sortie_id: string, data: {
  resume?: string; equipe?: number; contacts?: number; decisions?: number; temoignages?: string;
}) {
  const { error: statusError } = await supabase.from('sorties').update({ statut: 'passee' }).eq('id', sortie_id);
  if (statusError) failSupabase('upsertRapportSortie (statut sortie)', statusError);
  const { error } = await supabase.from('rapports_sorties').upsert({
    sortie_id, resume: data.resume || null,
    taille_equipe: data.equipe || null, contacts: data.contacts || null,
    decisions: data.decisions || null, created_by: await authorId(),
  }, { onConflict: 'sortie_id' });
  if (error) failSupabase('upsertRapportSortie', error);
}

// ── IPB — Cours admin ─────────────────────────────────────────────────────────

export async function createIPBCours(data: { code: string; titre: string; niveau?: string; prof?: string; desc?: string; modules?: number }): Promise<string> {
  const { data: row, error } = await supabase.from('ipb_cours').insert({
    code: data.code, titre: data.titre,
    professeur: data.prof || null, nombre_modules: data.modules ?? null,
    ...(data.niveau ? { niveau: data.niveau } : {}),
    ...(data.desc ? { description: data.desc } : {}),
  }).select('id').single();
  if (error) failSupabase('createIPBCours', error);
  return row.id;
}

export async function updateIPBCours(id: string, data: { code?: string; titre?: string; niveau?: string; prof?: string; desc?: string; modules?: number }) {
  const patch: Record<string, unknown> = {};
  if (data.code !== undefined) patch.code = data.code;
  if (data.titre !== undefined) patch.titre = data.titre;
  if (data.prof !== undefined) patch.professeur = data.prof || null;
  if (data.modules !== undefined) patch.nombre_modules = data.modules;
  if (data.niveau) patch.niveau = data.niveau;
  if (data.desc) patch.description = data.desc;
  const { error } = await supabase.from('ipb_cours').update(patch).eq('id', id);
  if (error) failSupabase('updateIPBCours', error);
}

export async function deleteIPBCours(id: string) {
  const { error } = await supabase.from('ipb_cours').delete().eq('id', id);
  if (error) failSupabase('deleteIPBCours', error);
}

// ── IPB — Documents d'un cours ────────────────────────────────────────────────

export type IPBDocument = { id: string; titre: string; fichier_url: string; type: string };

export async function getIPBDocuments(cours_id: string): Promise<IPBDocument[]> {
  const { data, error } = await supabase
    .from('ipb_documents')
    .select('id, titre, fichier_url, type, created_at')
    .eq('cours_id', cours_id)
    .order('created_at', { ascending: true });
  if (error) { logSupabaseError('getIPBDocuments', error); return []; }
  return (data ?? []).map(d => ({
    id: d.id, titre: d.titre, fichier_url: d.fichier_url ?? '', type: d.type ?? 'pdf',
  }));
}

export async function addIPBDocument(cours_id: string, titre: string, fichier_url: string): Promise<IPBDocument> {
  const { data, error } = await supabase.from('ipb_documents')
    .insert({ cours_id, titre, fichier_url, type: 'pdf' })
    .select('id, titre, fichier_url, type').single();
  if (error) failSupabase('addIPBDocument', error);
  return { id: data.id, titre: data.titre, fichier_url: data.fichier_url ?? '', type: data.type ?? 'pdf' };
}

export async function deleteIPBDocument(id: string) {
  const { error } = await supabase.from('ipb_documents').delete().eq('id', id);
  if (error) failSupabase('deleteIPBDocument', error);
}

// ── IPB — Traitement d'une inscription ────────────────────────────────────────
// statut ∈ enum statut_inscription ('validee' | 'refusee'). À la validation, on
// active etudiant_ipb sur le profil lié → accès aux cours en ligne.
export async function setInscriptionStatut(id: string, statut: 'validee' | 'refusee', profile_id?: string) {
  const { error } = await supabase
    .from('ipb_inscriptions')
    .update({ statut, treated_at: new Date().toISOString(), treated_by: await authorId() })
    .eq('id', id);
  if (error) failSupabase('setInscriptionStatut', error);
  if (statut === 'validee' && profile_id) {
    await setEtudiantIPB(profile_id, true);
  }
}

// ── IPB — Vitrine (contenu clé/valeur) ────────────────────────────────────────

// upsert sur la contrainte unique `cle` → fonctionne que la ligne existe déjà
// (script de seed exécuté) ou non (nouvelle clé / table fraîchement créée).
export async function updateIPBVitrine(cle: string, valeur: string) {
  const { error } = await supabase
    .from('ipb_vitrine')
    .upsert({ cle, valeur }, { onConflict: 'cle' });
  if (error) failSupabase('updateIPBVitrine', error);
}

// ── Statistiques admin ────────────────────────────────────────────────────────

export async function getAdminStats() {
  const [memRes, etuRes, cntRes, priRes, temRes] = await Promise.allSettled([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('etudiant_ipb', true),
    supabase.from('enseignements').select('id', { count: 'exact', head: true }),
    supabase.from('prieres').select('id', { count: 'exact', head: true }),
    supabase.from('temoignages').select('id', { count: 'exact', head: true }).eq('statut', 'en_attente'),
  ]);

  const members = memRes.status === 'fulfilled' ? (memRes.value.count ?? 0) : 0;
  const students = etuRes.status === 'fulfilled' ? (etuRes.value.count ?? 0) : 0;
  const contenus = cntRes.status === 'fulfilled' ? (cntRes.value.count ?? 0) : 0;
  const prieres = priRes.status === 'fulfilled' ? (priRes.value.count ?? 0) : 0;
  const pendingTem = temRes.status === 'fulfilled' ? (temRes.value.count ?? 0) : 0;

  return { members, students, contenus, prieres, pendingTem };
}

// ── Super Admin — Profiles ────────────────────────────────────────────────────

export type Profile = {
  id: string; nom_complet: string; email: string;
  role: string; etudiant_ipb: boolean; created_at: string;
};

export async function getAllProfiles(roleFilter?: string): Promise<Profile[]> {
  // email vit dans auth.users → fonction SQL profils_avec_email() (jointure security definer)
  let q = supabase.rpc('profils_avec_email');
  if (roleFilter) q = q.eq('role', roleFilter);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) failSupabase('getAllProfiles', error);
  return ((data as Profile[]) ?? []).map(p => ({
    id: p.id,
    nom_complet: p.nom_complet ?? '',
    email: p.email ?? '',
    role: p.role ?? 'membre',
    etudiant_ipb: p.etudiant_ipb ?? false,
    created_at: p.created_at ?? '',
  }));
}

export async function updateProfileRole(id: string, role: string) {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
  if (error) failSupabase('updateProfileRole', error);
}

export async function setEtudiantIPB(id: string, val: boolean) {
  const { error } = await supabase.from('profiles').update({ etudiant_ipb: val }).eq('id', id);
  if (error) failSupabase('setEtudiantIPB', error);
}

export async function getSuperAdminStats() {
  const [memRes, respRes, saRes, etuRes, priRes, temRes] = await Promise.allSettled([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'responsable'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'super_admin'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('etudiant_ipb', true),
    supabase.from('prieres').select('id', { count: 'exact', head: true }),
    supabase.from('temoignages').select('id', { count: 'exact', head: true }).eq('statut', 'en_attente'),
  ]);
  return {
    members:  memRes.status  === 'fulfilled' ? (memRes.value.count  ?? 0) : 0,
    resps:    respRes.status === 'fulfilled' ? (respRes.value.count ?? 0) : 0,
    superadmins: saRes.status === 'fulfilled' ? (saRes.value.count ?? 0) : 0,
    students: etuRes.status  === 'fulfilled' ? (etuRes.value.count  ?? 0) : 0,
    prieres:  priRes.status  === 'fulfilled' ? (priRes.value.count  ?? 0) : 0,
    pendingTem: temRes.status === 'fulfilled' ? (temRes.value.count ?? 0) : 0,
  };
}

export async function getRecentSignups(days = 7): Promise<Profile[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data } = await supabase
    .rpc('profils_avec_email')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(10);
  return ((data as Profile[]) ?? []).map(p => ({
    id: p.id, nom_complet: p.nom_complet ?? '', email: p.email ?? '',
    role: p.role ?? 'membre', etudiant_ipb: p.etudiant_ipb ?? false, created_at: p.created_at ?? '',
  }));
}

// ── Super Admin — Audit logs ──────────────────────────────────────────────────

export type ActionLog = {
  id: string; admin_id: string; admin_nom: string;
  action: string; cible: string; details: string; created_at: string;
};

export async function logAction(action: string, cible: string, details?: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const { data: profile } = await supabase
    .from('profiles').select('nom_complet').eq('id', session.user.id).single();
  await supabase.from('audit_logs').insert({
    admin_id: session.user.id,
    admin_nom: profile?.nom_complet ?? 'Super Admin',
    action, cible, details: details ?? null,
  });
}

export async function getActionLogs(limit = 50): Promise<ActionLog[]> {
  const { data } = await supabase
    .from('audit_logs')
    .select('id, admin_id, admin_nom, action, cible, details, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []).map(l => ({
    id: l.id, admin_id: l.admin_id, admin_nom: l.admin_nom ?? '',
    action: l.action, cible: l.cible ?? '', details: l.details ?? '', created_at: l.created_at,
  }));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function relDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return 'il y a < 1 h';
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'hier';
  if (d < 7) return `il y a ${d} j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}
