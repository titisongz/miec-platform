import { test, expect } from '@playwright/test';
import { requireEnv } from './helpers/env';
import { login } from './helpers/auth';
import { setMaintenanceSafe } from './helpers/supabase';

// Flux 1 — Un membre peut se connecter et se déconnecter.
test.describe('Flux 1 — Connexion / déconnexion membre', () => {
  // Le membre a besoin de l'app normale : on garantit maintenance = off.
  test.beforeEach(async () => {
    await setMaintenanceSafe(false);
  });

  test('un membre peut se connecter puis se déconnecter', async ({ page }) => {
    await login(page, requireEnv('E2E_MEMBER_EMAIL'), requireEnv('E2E_MEMBER_PASSWORD'));

    // Connecté : l'onglet Compte (exact, pour ne pas matcher « Créer un compte »)
    // affiche l'espace membre et son bouton de déconnexion.
    await page.getByRole('button', { name: 'Compte', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Se déconnecter', exact: true })).toBeVisible();

    // Déconnexion.
    await page.getByRole('button', { name: 'Se déconnecter', exact: true }).click();

    // Déconnecté : l'onglet Compte présente de nouveau l'écran de connexion.
    await page.getByRole('button', { name: 'Compte', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Se connecter', exact: true })).toBeVisible();
  });
});
