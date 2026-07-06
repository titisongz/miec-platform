import { test, expect } from '@playwright/test';
import { requireEnv } from './helpers/env';
import { login } from './helpers/auth';
import { setMaintenanceSafe } from './helpers/supabase';

// Flux 4 — Un super_admin active/désactive le mode maintenance ; effet immédiat sur le front.
test.describe('Flux 4 — Mode maintenance', () => {
  // État connu au départ, et restauration à la fin (plateforme ouverte).
  test.beforeEach(async () => {
    await setMaintenanceSafe(false);
  });
  test.afterEach(async () => {
    await setMaintenanceSafe(false);
  });

  test('un super_admin active/désactive la maintenance, effet immédiat sur le front', async ({ browser }) => {
    const superCtx = await browser.newContext();
    const superAdmin = await superCtx.newPage();
    try {
      await login(superAdmin, requireEnv('E2E_SUPERADMIN_EMAIL'), requireEnv('E2E_SUPERADMIN_PASSWORD'));
      await superAdmin.goto('/superadmin/parametres');
      await expect(superAdmin.getByRole('heading', { name: 'Paramètres globaux' })).toBeVisible();

      // Le toggle maintenance vit dans la « zone danger » ; l'input checkbox est
      // masqué (0×0), on clique donc le label qui l'enveloppe.
      const toggleLabel = superAdmin.locator('.sa-danger label.sa-toggle');
      const toggleInput = superAdmin.locator('.sa-danger input[type="checkbox"]');
      await expect(toggleInput).not.toBeChecked();

      // ── ACTIVER ──
      await toggleLabel.click();
      await expect(superAdmin.getByText('Mode maintenance activé')).toBeVisible();
      await expect(toggleInput).toBeChecked();

      // Effet immédiat : un visiteur qui ouvre l'app voit l'écran de maintenance.
      const v1Ctx = await browser.newContext();
      const v1 = await v1Ctx.newPage();
      try {
        await v1.goto('/');
        await expect(v1.getByText('MIEC est en maintenance')).toBeVisible();
      } finally {
        await v1Ctx.close();
      }

      // ── DÉSACTIVER ──
      await toggleLabel.click();
      await expect(superAdmin.getByText('Mode maintenance désactivé')).toBeVisible();
      await expect(toggleInput).not.toBeChecked();

      // Effet immédiat : l'app normale est de nouveau accessible.
      const v2Ctx = await browser.newContext();
      const v2 = await v2Ctx.newPage();
      try {
        await v2.goto('/');
        await expect(v2.getByRole('button', { name: 'Accueil' })).toBeVisible();
        await expect(v2.getByText('MIEC est en maintenance')).toHaveCount(0);
      } finally {
        await v2Ctx.close();
      }
    } finally {
      await superCtx.close();
    }
  });
});
