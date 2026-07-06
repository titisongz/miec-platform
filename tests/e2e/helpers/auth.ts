import { type Page, expect } from '@playwright/test';

// L'app MIEC est une SPA « maquette téléphone ». La connexion se fait via
// l'onglet « Compte » (écran AuthScreen). Si le mode maintenance est actif,
// l'app remplace tout par l'écran de maintenance : on emprunte alors le lien
// « Connexion administrateur » qui ouvre le même écran de connexion par-dessus.
async function openAuthScreen(page: Page): Promise<void> {
  await page.goto('/');

  // exact: true — sinon « Compte » matche aussi le bouton « Créer un compte »,
  // et « Se connecter » resterait sans ambiguïté mais on verrouille par sûreté.
  const maintenanceLink = page.getByRole('button', { name: 'Connexion administrateur', exact: true });
  const compteTab = page.getByRole('button', { name: 'Compte', exact: true });

  // Attend la fin du boot : soit l'app normale (onglet Compte), soit l'écran de
  // maintenance (lien admin).
  await expect(maintenanceLink.or(compteTab).first()).toBeVisible({ timeout: 30_000 });

  if (await maintenanceLink.isVisible().catch(() => false)) {
    await maintenanceLink.click();
  } else {
    await compteTab.click();
  }

  await expect(page.getByRole('button', { name: 'Se connecter', exact: true })).toBeVisible();
}

/**
 * Connecte un utilisateur via l'interface réelle et attend que la session soit
 * établie (l'écran de connexion disparaît). Fonctionne quel que soit l'état du
 * mode maintenance — l'objectif est de poser la session dans ce contexte.
 */
export async function login(page: Page, email: string, password: string): Promise<void> {
  await openAuthScreen(page);
  await page.getByLabel('Adresse email').fill(email);
  await page.getByLabel('Mot de passe', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();

  // Succès = l'AuthScreen se démonte : on attend la disparition du champ email
  // (signal fiable, contrairement au bouton dont le libellé passe à « Connexion… »
  // pendant la requête, ce qui validerait trop tôt).
  await expect(page.getByLabel('Adresse email')).toBeHidden({ timeout: 30_000 });
}
