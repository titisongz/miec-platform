import { supabase } from './supabase';

// ── Verset du jour ────────────────────────────────────────────────────────────

export async function upsertVerset(texte: string, reference: string, medit?: string) {
  const today = new Date().toISOString().split('T')[0];
  const { error } = await supabase
    .from('versets')
    .upsert({ texte, reference, meditation: medit ?? null, date_publication: today }, { onConflict: 'date_publication' });
  if (error) throw error;
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
    texte: data.texte || null, type: data.type || 'text',
  });
  if (error) throw error;
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
  if (error) throw error;
}

export async function deleteEnseignement(id: string) {
  const { error } = await supabase.from('enseignements').delete().eq('id', id);
  if (error) throw error;
}

// ── Séries ────────────────────────────────────────────────────────────────────

export async function createSerie(titre: string): Promise<string> {
  const { data, error } = await supabase.from('series').insert({ titre }).select('id').single();
  if (error) throw error;
  return data.id;
}

// ── Témoignages — admin ───────────────────────────────────────────────────────

export async function getPendingTemoignages() {
  const { data, error } = await supabase
    .from('temoignages')
    .select(`id, titre, categorie, anonyme, contenu, created_at, auteur:profiles(nom_complet)`)
    .eq('statut', 'en_attente')
    .order('created_at', { ascending: false });
  if (error) throw error;
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
  if (error) throw error;
}

export async function unpublishTemoignage(id: string) {
  const { error } = await supabase.from('temoignages').update({ statut: 'en_attente' }).eq('id', id);
  if (error) throw error;
}

export async function deleteTemoignage(id: string) {
  const { error } = await supabase.from('temoignages').delete().eq('id', id);
  if (error) throw error;
}

// ── Annonces ──────────────────────────────────────────────────────────────────

export async function createAnnonce(data: { titre: string; cat: string; date: string; full: string }) {
  const { error } = await supabase.from('annonces').insert({
    titre: data.titre, categorie: data.cat,
    date_evenement: data.date || null, contenu: data.full,
  });
  if (error) throw error;
}

export async function updateAnnonce(id: string, data: { titre: string; cat: string; date: string; full: string }) {
  const { error } = await supabase.from('annonces').update({
    titre: data.titre, categorie: data.cat,
    date_evenement: data.date || null, contenu: data.full,
  }).eq('id', id);
  if (error) throw error;
}

export async function deleteAnnonce(id: string) {
  const { error } = await supabase.from('annonces').delete().eq('id', id);
  if (error) throw error;
}

// ── Prières ───────────────────────────────────────────────────────────────────

export async function deletePriere(id: string) {
  const { error } = await supabase.from('prieres').delete().eq('id', id);
  if (error) throw error;
}

// ── Ressources ────────────────────────────────────────────────────────────────

export async function createRessource(data: { titre: string; type: string; cat: string; desc?: string; taille?: string }) {
  const { error } = await supabase.from('ressources').insert({
    titre: data.titre, type: data.type, categorie: data.cat,
    description: data.desc || null, taille: data.taille || null,
  });
  if (error) throw error;
}

export async function updateRessource(id: string, data: { titre: string; type: string; cat: string; desc?: string }) {
  const { error } = await supabase.from('ressources').update({
    titre: data.titre, type: data.type, categorie: data.cat,
    description: data.desc || null,
  }).eq('id', id);
  if (error) throw error;
}

export async function deleteRessource(id: string) {
  const { error } = await supabase.from('ressources').delete().eq('id', id);
  if (error) throw error;
}

// ── Livres ────────────────────────────────────────────────────────────────────

export async function createLivre(data: { titre: string; auteur: string; annee?: number; pages?: number; cat: string; desc?: string; extrait?: string }) {
  const { error } = await supabase.from('livres').insert({
    titre: data.titre, auteur: data.auteur,
    annee: data.annee || null, pages: data.pages || null,
    categorie: data.cat, description: data.desc || null,
    extrait: data.extrait || null,
  });
  if (error) throw error;
}

export async function updateLivre(id: string, data: { titre: string; auteur: string; annee?: number; pages?: number; cat: string; desc?: string; extrait?: string }) {
  const { error } = await supabase.from('livres').update({
    titre: data.titre, auteur: data.auteur,
    annee: data.annee || null, pages: data.pages || null,
    categorie: data.cat, description: data.desc || null,
    extrait: data.extrait || null,
  }).eq('id', id);
  if (error) throw error;
}

export async function deleteLivre(id: string) {
  const { error } = await supabase.from('livres').delete().eq('id', id);
  if (error) throw error;
}

// ── Sorties ───────────────────────────────────────────────────────────────────

export async function createSortie(data: { titre: string; date: string; heure?: string; equipe?: number; theme?: string; programme?: string }) {
  const { error } = await supabase.from('sorties').insert({
    titre: data.titre, date: data.date || null,
    heure: data.heure || null, theme: data.theme || null,
    programme: data.programme || null, statut: 'a_venir',
  });
  if (error) throw error;
}

export async function updateSortie(id: string, data: { titre: string; date: string; heure?: string; equipe?: number; theme?: string; programme?: string }) {
  const { error } = await supabase.from('sorties').update({
    titre: data.titre, date: data.date || null,
    heure: data.heure || null, theme: data.theme || null,
    programme: data.programme || null,
  }).eq('id', id);
  if (error) throw error;
}

export async function deleteSortie(id: string) {
  const { error } = await supabase.from('sorties').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertRapportSortie(sortie_id: string, data: {
  resume?: string; equipe?: number; contacts?: number; decisions?: number; temoignages?: string;
}) {
  const { error: statusError } = await supabase.from('sorties').update({ statut: 'passee' }).eq('id', sortie_id);
  if (statusError) throw statusError;
  const { error } = await supabase.from('rapports_sorties').upsert({
    sortie_id, resume: data.resume || null,
    taille_equipe: data.equipe || null, contacts: data.contacts || null,
    decisions: data.decisions || null,
  }, { onConflict: 'sortie_id' });
  if (error) throw error;
}

// ── IPB — Cours admin ─────────────────────────────────────────────────────────

export async function createIPBCours(data: { code: string; titre: string; niveau: string; prof?: string; desc?: string }) {
  const { error } = await supabase.from('ipb_cours').insert({
    code: data.code, titre: data.titre, niveau: data.niveau,
    professeur: data.prof || null, description: data.desc || null,
  });
  if (error) throw error;
}

export async function updateIPBCours(id: string, data: { code?: string; titre?: string; niveau?: string; prof?: string; desc?: string; actif?: boolean }) {
  const patch: Record<string, unknown> = {};
  if (data.code !== undefined) patch.code = data.code;
  if (data.titre !== undefined) patch.titre = data.titre;
  if (data.niveau !== undefined) patch.niveau = data.niveau;
  if (data.prof !== undefined) patch.professeur = data.prof || null;
  if (data.desc !== undefined) patch.description = data.desc || null;
  if (data.actif !== undefined) patch.actif = data.actif;
  const { error } = await supabase.from('ipb_cours').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteIPBCours(id: string) {
  const { error } = await supabase.from('ipb_cours').delete().eq('id', id);
  if (error) throw error;
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
