import { defineConfig, devices } from '@playwright/test';
import { BASE_URL } from './tests/e2e/helpers/env';

// Tests E2E MIEC. Exécution SÉRIELLE (workers: 1) volontaire : les flux partagent
// une base Supabase réelle et un état global (mode maintenance) — le parallélisme
// provoquerait des interférences entre tests. Chaque test reste néanmoins
// indépendant (préconditions + nettoyage propres) et peut être lancé seul.
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  globalSetup: './tests/e2e/global-setup.ts',

  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  // Au moins 1 retry, même en local : la suite peut viser un déploiement distant
  // (E2E_BASE_URL) et absorber ainsi les aléas réseau transitoires.
  retries: process.env.CI ? 2 : 1,

  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 90_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: BASE_URL,
    locale: 'fr-FR',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  // Démarre le serveur Next automatiquement s'il n'y en a pas déjà un.
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
