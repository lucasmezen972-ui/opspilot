# Tests OpsPilot

## Commandes

| Commande            | Contenu                                              |
| ------------------- | ---------------------------------------------------- |
| `npm run quality`   | typecheck + lint + format:check + vitest (= job CI). |
| `npm test`          | vitest seul.                                         |
| `npm run build:web` | export web statique (`dist/`).                       |
| `npm run test:e2e`  | Playwright (nécessite `build:web` au préalable).     |

## Tests unitaires (`__tests__/`, vitest + Testing Library)

Couvrent les fonctions pures (tokens du design system, `mapSupabaseError`,
`isFeatureEnabled`…), des hooks et des écrans clés. Règle : tout nouvel
export d'un hook **mocké** doit être ajouté aux mocks des tests d'écrans,
sinon le typecheck casse.

## Tests E2E (`e2e/`, Playwright sur Chromium)

Assertions **strictes** uniquement : pas de `.catch(() => {})`, pas de
`bodyText.length`. La navigation et les données sont vérifiées via des
**testID stables** — un testID est un contrat, ne pas le renommer sans
mettre à jour la spec. Convention recommandée : `module-action-element`
(ex. `audit-create-button`, `product-card-<id>`).

### Déterminisme du mode démo (leçon importante)

Les tests « démo locale » bloquent Supabase pour des données déterministes
via `blockSupabase` (`e2e/helpers.ts`). Ce helper **doit réellement
bloquer** : il filtre par regex `/supabase\.co/`. Un glob du type
`**/supabase.co/**` ne matche PAS l'hôte réel (`xxx.supabase.co`, point et
non slash) et laisse passer une vraie session → les tests récupèrent les
données de la base au lieu des fixtures locales (régression silencieuse
corrigée en juin 2026).

## Serveur de test

Les E2E sont servies par `e2e/server.mjs` (statique déterministe,
équivalent GitHub Pages : index de répertoire, cleanUrls, fallback SPA) —
et non `serve --single`, dont les réécritures rendaient le back-office
inatteignable.
