# Guide développeur OpsPilot

Tout ce qu'il faut savoir pour travailler sur le code. Le README racine
décrit le produit ; ce document décrit l'architecture et les conventions.

## Stack

- **Expo / React Native + TypeScript** — une seule base de code, déployée en
  web statique sur GitHub Pages (`expo export --platform web`).
- **Expo Router** — routing par fichiers dans `app/`.
- **Supabase** — auth, Postgres (RLS multi-tenant par `organization_id`),
  Edge Functions (Stripe). Projet de production : **OPS PILOT V2**
  (`hpqfmuzkkxrqoqoabjmb`, eu-west-3). L'ancien projet us-east-1 est mort.

## Arborescence

```
app/                Routes Expo Router (1 fichier = 1 écran)
  (tabs)/           Écrans de la barre d'onglets — orchestrateurs minces
features/           Composants et constantes par domaine métier
  actions/          ActionCard, CreateActionModal, constants
  audits/           QuestionnaireModal, constants (templates, questions)
  products/         ProductCard, StockModal, AddProductModal, modalStyles
hooks/              Hooks data (1 par table) + AuthContext
lib/                supabase.ts (client + types), demoData.ts, demoStore.ts
components/         Composants transverses (AuthScreen, RequireRole…)
utils/              alertPolyfill, error, logger, exports CSV/rapport
supabase/
  migrations/       SQL rejoué par CI — lire migrations/README.md AVANT d'y toucher
  functions/        Edge Functions (Stripe checkout/portal/webhook/worker)
e2e/                Tests Playwright (34) — testIDs stables obligatoires
__tests__/          Tests unitaires vitest (38)
```

Règle d'or : les écrans de `app/(tabs)/` orchestrent (état de navigation,
appels de hooks) ; la logique d'affichage réutilisable vit dans `features/`.

## Le mode démo (à comprendre avant tout)

Deux modes selon la disponibilité de Supabase au moment du clic
« Connexion Démo » :

- **Démo en ligne** : vraie session Supabase (compte demo@opspilot.com),
  données lues en base (org `550e8400-…0000`).
- **Démo locale** : Supabase injoignable → fallback sans session.
  `isLocalDemo = isDemoMode && !session` dans chaque hook data, qui bascule
  alors sur **`lib/demoStore.ts`** : un store `useSyncExternalStore` partagé
  entre tous les écrans (une action créée dans Audits apparaît dans Actions
  et le dashboard). Persistance du mode via `localStorage`
  (`opspilot_demo_mode`) : reload et deep-link restent connectés.

Pièges historiques (ne pas réintroduire) :

- ne jamais poser de fausse session en démo locale (ça casse `isLocalDemo`) ;
- ne pas supprimer `demoModeRef` dans `AuthContext` (sinon
  `onAuthStateChange` écrase l'état démo au boot) ;
- ne pas supprimer `utils/alertPolyfill.ts` (react-native-web n'implémente
  pas `Alert.alert` ; le polyfill mappe confirm() sur le DERNIER bouton
  non-cancel).

## Scripts

| Commande                 | Effet                                               |
| ------------------------ | --------------------------------------------------- |
| `npm run dev`            | Expo dev server                                     |
| `npm run quality`        | typecheck + lint + format:check + vitest (= job CI) |
| `npm test`               | vitest seul                                         |
| `npm run test:e2e`       | Playwright (nécessite `npm run build:web` d'abord)  |
| `npm run build:web`      | export web statique dans `dist/`                    |
| `npm run format` / `fix` | prettier / eslint --fix                             |

## Tests

- **Unitaires** (`__tests__/`, vitest + Testing Library) : tout nouvel export
  d'un hook mocké doit être ajouté aux mocks des tests d'écrans
  (HomeScreen, ManagerDashboard), sinon le typecheck échoue.
- **E2E** (`e2e/`, Playwright) : assertions strictes uniquement — testIDs,
  jamais de `.catch(() => {})` ni de `bodyText.length`. `loginAsLocalDemo`
  bloque `**/supabase.co/**` pour des données déterministes. Les testIDs
  sont un contrat : ne pas les renommer sans mettre à jour les specs.

## CI/CD (GitHub Actions, sur main et PR vers main)

- **CI** (`tests.yml`) : `npm run quality` + build web + E2E Chromium.
- **Deploy to GitHub Pages** (`deploy.yml`) : publie `dist/` →
  https://lucasmezen972-ui.github.io/opspilot/
- **Apply Supabase migrations** (`migrate.yml`) : rejoue
  `supabase/migrations/2026*.sql` sur V2 quand ce dossier change.
  Les migrations doivent être **idempotentes** ; deux fichiers historiques
  sont volontairement sautés (voir `supabase/migrations/README.md`).
- **Deploy Supabase Edge Functions** (`deploy-functions.yml`).

## Assistant IA

La conversation « Assistant IA OpsPilot » appelle la fonction Edge
`ai-assistant` uniquement avec une vraie session Supabase. La clé Anthropic
reste un secret serveur et ne doit jamais être exposée via une variable
`EXPO_PUBLIC_*`.

```bash
supabase secrets set \
  --project-ref hpqfmuzkkxrqoqoabjmb \
  ANTHROPIC_API_KEY="sk-ant-..."
```

En démo locale, l'assistant utilise les KPIs du `demoStore` et répond sans
réseau. La fonction distante vérifie le JWT, l'organisation et applique un
rate limit par utilisateur.

## Conventions

- Branche de travail → PR vers `main` ; la CI doit être verte avant merge.
- Prettier appliqué partout (`format:check` bloque la CI).
- Textes UI en français ; messages d'erreur passés par `utils/error.ts`.
