import { test, expect } from '@playwright/test';

// Flux 5 — Un visiteur non connecté ne peut accéder ni à /admin ni à /superadmin.
// (Aucune donnée créée, aucune connexion : ce test ne dépend d'aucun identifiant.)
test.describe('Flux 5 — Contrôle d\'accès back-office', () => {
  test('un visiteur non connecté ne peut pas accéder à /admin ni /superadmin', async ({ page }) => {
    // /admin : le garde affiche l'écran « Accès refusé » (pas de session) et le
    // back-office lui-même n'est pas rendu (son libellé de sidebar est absent).
    await page.goto('/admin');
    await expect(page.getByText('Accès refusé')).toBeVisible();
    await expect(page.getByText('Espace responsables')).toHaveCount(0);

    // /superadmin : le garde redirige vers l'accueil.
    await page.goto('/superadmin');
    await expect(page).toHaveURL('/');
  });
});
