import { supabase } from './supabase';

// ── Notifications automatiques ───────────────────────────────────────────────
//
// Chaque fonction insère une notification PAR destinataire via une fonction
// SQL SECURITY DEFINER (cf. supabase/fix-notifications.sql) :
//   • notifier_tous          → tous les membres SAUF l'auteur de l'action
//   • notifier_responsables  → responsables + super_admins
//   • notifier_membre        → un destinataire précis
//
// Tout est « best-effort » : une notification ne doit JAMAIS faire échouer
// l'action principale (déposer une prière, publier une annonce, etc.).

async function safeRpc(fn: string, args: Record<string, unknown>): Promise<void> {
  try {
    const { error } = await supabase.rpc(fn, args);
    if (error) console.warn(`[notifications] ${fn} —`, error.message);
  } catch (e) {
    console.warn(`[notifications] ${fn} —`, e);
  }
}

// Nouvelle prière → tous les membres sauf l'auteur.
export function notifyNewPriere(auteurNom: string, sujet: string): Promise<void> {
  return safeRpc('notifier_tous', {
    p_type: 'priere',
    p_titre: 'Nouveau sujet de prière',
    p_message: `${auteurNom} : ${sujet}`,
    p_lien: '/priere',
  });
}

// Nouveau témoignage → responsables (en attente de validation).
export function notifyNewTemoignage(auteurNom: string): Promise<void> {
  return safeRpc('notifier_responsables', {
    p_type: 'temoignage',
    p_titre: 'Témoignage à valider',
    p_message: `${auteurNom} a soumis un témoignage en attente de validation.`,
    p_lien: '/temoignages',
  });
}

// Témoignage validé → l'auteur du témoignage.
export function notifyTemoignageValide(auteurId: string, titre: string): Promise<void> {
  return safeRpc('notifier_membre', {
    p_profile: auteurId,
    p_type: 'temoignage',
    p_titre: 'Votre témoignage est publié',
    p_message: `Votre témoignage « ${titre} » a été publié. Merci !`,
    p_lien: '/temoignages',
  });
}

// Nouvelle annonce → tous les membres.
export function notifyNewAnnonce(titre: string): Promise<void> {
  return safeRpc('notifier_tous', {
    p_type: 'annonce', p_titre: 'Nouvelle annonce', p_message: titre, p_lien: '/annonces',
  });
}

// Nouvel enseignement → tous les membres.
export function notifyNewEnseignement(titre: string): Promise<void> {
  return safeRpc('notifier_tous', {
    p_type: 'enseignement', p_titre: 'Nouvel enseignement', p_message: titre, p_lien: '/enseignements',
  });
}

// Nouvelle sortie d'évangélisation → tous les membres.
export function notifyNewSortie(titre: string, date: string): Promise<void> {
  return safeRpc('notifier_tous', {
    p_type: 'evangelisation',
    p_titre: "Nouvelle sortie d'évangélisation",
    p_message: date ? `${titre} · ${date}` : titre,
    p_lien: '/evangelisation',
  });
}

// Nouvelle inscription IPB → responsables.
export function notifyInscriptionIPB(nom: string): Promise<void> {
  return safeRpc('notifier_responsables', {
    p_type: 'inscription_ipb',
    p_titre: 'Nouvelle inscription IPB',
    p_message: `${nom} s'est inscrit(e) à l'Institut Biblique.`,
    p_lien: '/ipb',
  });
}

// Diffusion manuelle depuis le back-office → tous les membres.
export function notifyBroadcast(type: string, titre: string, message: string, lien?: string): Promise<void> {
  return safeRpc('notifier_tous', {
    p_type: type, p_titre: titre, p_message: message, p_lien: lien ?? null,
  });
}
