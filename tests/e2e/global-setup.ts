import { setMaintenanceSafe } from './helpers/supabase';

// S'exécute une fois avant toute la suite. Garantit un état de départ « ouvert »
// (mode maintenance désactivé) pour que les flux membre/responsable disposent de
// l'app normale. Best-effort : si les identifiants super_admin ne sont pas
// configurés, on n'interrompt pas la suite (le flux d'accès public n'en a pas
// besoin ; les flux qui exigent des identifiants échoueront avec un message clair).
export default async function globalSetup(): Promise<void> {
  await setMaintenanceSafe(false);
}
