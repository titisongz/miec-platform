import path from 'node:path';
import { existsSync } from 'node:fs';
import { config as loadDotenv } from 'dotenv';

// Charge les variables d'environnement pour le PROCESSUS DE TEST (Node).
//
// IMPORTANT : les chemins sont résolus par rapport à __dirname (ce fichier vit
// dans tests/e2e/helpers/) et NON par rapport au cwd. Lancer `npx playwright test`
// depuis n'importe quel dossier fonctionne donc, et le fichier tests/e2e/.env.e2e
// est trouvé quel que soit le répertoire courant.
//
// dotenv n'écrase jamais une variable déjà définie : l'environnement réel
// (CI / shell) reste prioritaire sur les fichiers.
const E2E_DIR = path.resolve(__dirname, '..'); // tests/e2e
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..'); // racine du repo

// .env.e2e — identifiants des comptes de test.
// Emplacement recommandé : tests/e2e/.env.e2e ; la racine du projet est tolérée.
const E2E_CANDIDATES = [
  path.resolve(E2E_DIR, '.env.e2e'),
  path.resolve(PROJECT_ROOT, '.env.e2e'),
];

// .env.local — URL + clé anon Supabase (racine du projet, chargé par Next aussi).
const LOCAL_CANDIDATES = [path.resolve(PROJECT_ROOT, '.env.local')];

for (const p of [...E2E_CANDIDATES, ...LOCAL_CANDIDATES]) {
  if (existsSync(p)) loadDotenv({ path: p, quiet: true });
}

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Variable d'environnement manquante : ${name}. ` +
        `Copiez tests/e2e/.env.e2e.example en tests/e2e/.env.e2e et renseignez les identifiants ` +
        `(cf. tests/e2e/README.md).`,
    );
  }
  return v;
}

export const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
