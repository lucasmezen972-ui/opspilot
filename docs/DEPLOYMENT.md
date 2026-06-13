# Déploiement OpsPilot

Tout est automatisé par **GitHub Actions** sur la branche `main`. Aucun
déploiement manuel en temps normal.

## Cible

- **Application web** : GitHub Pages →
  https://lucasmezen972-ui.github.io/opspilot/
- **Back-office superadmin** : `/opspilot/admin/` (SPA statique servie au
  même endroit).
- **Backend** : Supabase « OPS PILOT V2 » (`hpqfmuzkkxrqoqoabjmb`,
  eu-west-3). L'ancien projet us-east-1 est mort — ne jamais l'utiliser.

## Workflows (`.github/workflows/`)

| Workflow               | Déclencheur                            | Rôle                                                          |
| ---------------------- | -------------------------------------- | ------------------------------------------------------------- |
| `tests.yml` (CI)       | push/PR sur `main`                     | `npm run quality` + build web + 43 E2E Playwright (Chromium). |
| `deploy.yml`           | push sur `main`                        | build web → `dist/` (+ `admin/`) → GitHub Pages.              |
| `migrate.yml`          | changement de `supabase/migrations/**` | rejoue les migrations `2026*.sql` sur V2.                     |
| `deploy-functions.yml` | changement de `supabase/functions/**`  | déploie les Edge Functions (`--no-verify-jwt`).               |

## Spécificités GitHub Pages

- Base path `/opspilot/`. Le SPA fallback (`404.html` = `index.html`) gère
  les routes côté client ; `.nojekyll` autorise les fichiers `_expo/`.
- Le back-office `admin/` est copié dans `dist/admin` au build.

## Variables / secrets

Build web : `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
(secrets GitHub ; fallback intégré sur le projet V2 si absents).
Migrations/fonctions : `SUPABASE_ACCESS_TOKEN`. Stripe / IA / email : voir
`docs/SUPABASE.md` (secrets Edge). **Aucun secret en clair dans le code.**

## Règle de travail

Branche dédiée → PR vers `main` → CI **verte** → merge (l'agent peut
auto-merger une fois la CI verte). Les checks « CircleCI » / « Supabase
Preview » rouges sur les PR sont des apps GitHub externes sans config, à
ignorer : seuls les checks GitHub Actions font foi.
