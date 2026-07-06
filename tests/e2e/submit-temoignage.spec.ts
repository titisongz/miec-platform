import { test, expect } from '@playwright/test';
import { requireEnv } from './helpers/env';
import { login } from './helpers/auth';
import { setMaintenanceSafe, deleteTemoignageByTitle } from './helpers/supabase';
import { marker } from './helpers/data';

// Flux 3 — Un membre soumet un témoignage ; il apparaît « en attente » dans /admin/temoignages.
test.describe('Flux 3 — Soumission d\'un témoignage', () => {
  const titre = marker('Témoignage');

  test.beforeEach(async () => {
    await setMaintenanceSafe(false);
  });

  // Nettoyage : supprime le témoignage soumis (statut en_attente).
  test.afterEach(async () => {
    await deleteTemoignageByTitle(titre);
  });

  test('un membre soumet un témoignage, il apparaît en attente dans /admin', async ({ browser }) => {
    // 1) Membre — soumission depuis l'app.
    const memberCtx = await browser.newContext();
    const member = await memberCtx.newPage();
    try {
      await login(member, requireEnv('E2E_MEMBER_EMAIL'), requireEnv('E2E_MEMBER_PASSWORD'));

      await member.locator('button.tile', { hasText: 'Témoignages' }).click();
      await member.getByRole('button', { name: 'Soumettre' }).click();

      await member.getByPlaceholder('Ce que Dieu a fait…').fill(titre);
      await member.getByPlaceholder('Partagez en quelques mots…').fill('Témoignage de test E2E — à supprimer.');
      await member.getByRole('button', { name: 'Envoyer pour validation' }).click();

      await expect(member.getByText('Témoignage envoyé')).toBeVisible();
    } finally {
      await memberCtx.close();
    }

    // 2) Responsable — le témoignage figure dans la file de validation de /admin.
    const adminCtx = await browser.newContext();
    const admin = await adminCtx.newPage();
    try {
      await login(admin, requireEnv('E2E_RESPONSABLE_EMAIL'), requireEnv('E2E_RESPONSABLE_PASSWORD'));
      await admin.goto('/admin/temoignages');
      // L'onglet « File de validation » (en_attente) est actif par défaut.
      await expect(admin.getByText(titre)).toBeVisible();
    } finally {
      await adminCtx.close();
    }
  });
});
