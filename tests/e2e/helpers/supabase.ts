import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { requireEnv } from './env';

// Client Supabase API pour l'orchestration des tests (préconditions + nettoyage).
// Utilisé HORS navigateur : mettre en place l'état (mode maintenance) et supprimer
// les données créées par un test. On réutilise la clé anon publique + un vrai
// compte : la RLS s'applique donc exactement comme en production.

function anonClient(): SupabaseClient {
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

async function signedIn(email: string, password: string): Promise<SupabaseClient> {
  const sb = anonClient();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Connexion API échouée pour ${email} : ${error.message}`);
  return sb;
}

async function asResponsable(): Promise<SupabaseClient> {
  return signedIn(requireEnv('E2E_RESPONSABLE_EMAIL'), requireEnv('E2E_RESPONSABLE_PASSWORD'));
}

async function asSuperAdmin(): Promise<SupabaseClient> {
  return signedIn(requireEnv('E2E_SUPERADMIN_EMAIL'), requireEnv('E2E_SUPERADMIN_PASSWORD'));
}

// ── Mode maintenance ────────────────────────────────────────────────────────

/** Écrit parametres.mode_maintenance (nécessite un super_admin — RLS). */
export async function setMaintenance(value: boolean): Promise<void> {
  const sb = await asSuperAdmin();
  try {
    const { error } = await sb
      .from('parametres')
      .upsert({ cle: 'mode_maintenance', valeur: String(value) }, { onConflict: 'cle' });
    if (error) throw new Error(`setMaintenance(${value}) a échoué : ${error.message}`);
  } finally {
    await sb.auth.signOut();
  }
}

/** Variante best-effort : n'échoue pas la suite si les identifiants manquent
 *  (utile pour le global-setup et le test d'accès public qui n'en a pas besoin). */
export async function setMaintenanceSafe(value: boolean): Promise<void> {
  try {
    await setMaintenance(value);
  } catch (e) {
    console.warn(`[e2e] setMaintenance(${value}) ignoré : ${(e as Error).message}`);
  }
}

// ── Nettoyage des données de test ───────────────────────────────────────────

/** Supprime tout enseignement portant exactement ce titre (via un responsable). */
export async function deleteEnseignementByTitle(titre: string): Promise<void> {
  const sb = await asResponsable();
  try {
    const { error } = await sb.from('enseignements').delete().eq('titre', titre);
    if (error) console.warn(`[e2e] nettoyage enseignement « ${titre} » : ${error.message}`);
  } finally {
    await sb.auth.signOut();
  }
}

/** Supprime tout témoignage portant exactement ce titre (via un responsable). */
export async function deleteTemoignageByTitle(titre: string): Promise<void> {
  const sb = await asResponsable();
  try {
    const { error } = await sb.from('temoignages').delete().eq('titre', titre);
    if (error) console.warn(`[e2e] nettoyage témoignage « ${titre} » : ${error.message}`);
  } finally {
    await sb.auth.signOut();
  }
}
