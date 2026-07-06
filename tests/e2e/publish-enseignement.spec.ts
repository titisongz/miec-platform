import { test, expect } from '@playwright/test';
import { requireEnv } from './helpers/env';
import { login } from './helpers/auth';
import { setMaintenanceSafe, deleteEnseignementByTitle } from './helpers/supabase';
import { marker } from './helpers/data';

// Flux 2 — Un responsable publie un enseignement depuis /admin ; il apparaît sur le front.
test.describe('Flux 2 — Publication d\'un enseignement', () => {
  const titre = marker('Enseignement');

  test.beforeEach(async () => {
    await setMaintenanceSafe(false);
  });

  // Nettoyage : supprime l'enseignement créé, quoi qu'il arrive.
  test.afterEach(async () => {
    await deleteEnseignementByTitle(titre);
  });

  test('un responsable publie un enseignement, il apparaît sur le front', async ({ browser }) => {
    // 1) Responsable — publication depuis le back-office.
    const adminCtx = await browser.newContext();
    const admin = await adminCtx.newPage();
    try {
      await login(admin, requireEnv('E2E_RESPONSABLE_EMAIL'), requireEnv('E2E_RESPONSABLE_PASSWORD'));
      await admin.goto('/admin/enseignements');

      await admin.getByRole('button', { name: 'Nouvel enseignement' }).click();
      await admin.getByPlaceholder('La foi qui déplace les montagnes').fill(titre);
      await admin.getByPlaceholder('Pasteur Daniel Mbarga').fill('E2E Testeur');
      await admin.getByRole('button', { name: 'Publier' }).click();

      await expect(admin.getByText('Enseignement publié')).toBeVisible();
    } finally {
      await adminCtx.close();
    }

    // 2) Visiteur — l'enseignement est visible sur le front (liste publique).
    const visitorCtx = await browser.newContext();
    const visitor = await visitorCtx.newPage();
    try {
      await visitor.goto('/');
      await visitor.locator('button.tile', { hasText: 'Enseignements' }).click();
      await expect(visitor.getByText(titre)).toBeVisible();
    } finally {
      await visitorCtx.close();
    }
  });
});
