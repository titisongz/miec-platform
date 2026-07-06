# Tests End-to-End (Playwright)

Tests des 5 flux critiques de MIEC, pilotant l'interface réelle contre votre
projet Supabase.

| Fichier | Flux |
|---|---|
| `auth.spec.ts` | 1 — Un membre se connecte puis se déconnecte |
| `publish-enseignement.spec.ts` | 2 — Un responsable publie un enseignement (`/admin`) → visible sur le front |
| `submit-temoignage.spec.ts` | 3 — Un membre soumet un témoignage → « en attente » dans `/admin/temoignages` |
| `maintenance.spec.ts` | 4 — Un super_admin active/désactive la maintenance → effet immédiat sur le front |
| `access-control.spec.ts` | 5 — Un visiteur non connecté est refusé sur `/admin` et `/superadmin` |

## Prérequis

1. **Navigateur Playwright** (une fois) :
   ```bash
   npx playwright install chromium
   ```
2. **Identifiants de test** : copiez `tests/e2e/.env.e2e.example` en
   `tests/e2e/.env.e2e` et renseignez trois comptes RÉELS de votre base, aux
   rôles `membre`, `responsable` et `super_admin`, avec **email confirmé**.
   L'URL et la clé anon Supabase sont lues depuis votre `.env.local` existant
   (racine du projet). Le chemin de `.env.e2e` est résolu par rapport au dossier
   des tests, pas au répertoire courant.

## Lancer

```bash
npm run test:e2e          # tous les flux (démarre `next dev` automatiquement)
npm run test:e2e:ui       # mode interactif Playwright
npx playwright test tests/e2e/access-control.spec.ts   # un seul flux
npx playwright show-report                              # rapport HTML
```

Si un serveur tourne déjà sur `http://localhost:3000`, il est réutilisé ;
sinon Playwright lance `npm run dev`.

## Points de conception

- **Indépendance & nettoyage.** Chaque test met en place ses préconditions
  (`mode_maintenance = false`) et supprime ses propres données en `afterEach`
  (l'enseignement / le témoignage créé, par titre unique préfixé `[E2E]`).
  Le flux 4 restaure toujours la maintenance à « désactivé ».
- **Exécution sérielle** (`workers: 1`). Les flux partagent une base réelle et
  un état global (mode maintenance) : le parallélisme créerait des interférences.
  Chaque test reste lançable isolément.
- **Nettoyage & préconditions via l'API Supabase** (helpers `tests/e2e/helpers`),
  en se connectant avec les mêmes comptes : la RLS s'applique comme en prod
  (pas de clé `service_role`).
- **Seul le flux 5 ne requiert aucun identifiant** (il ne teste que les gardes
  d'accès publics).
