// Génère un titre unique et repérable pour les données créées par les tests.
// Le préfixe « [E2E] » permet de retrouver/purger facilement d'éventuels restes
// dans Supabase, et l'horodatage évite toute collision entre exécutions.
export function marker(label: string): string {
  return `[E2E] ${label} ${Date.now()}`;
}
