# Guide développeur OpsPilot

Tout ce qu'il faut savoir pour travailler sur le code. Le README racine
décrit le produit ; ce document décrit l'architecture et les conventions.
**État complet du projet (fonctionnalités, infra, back-office, emails) :
[ETAT-PROJET.md](ETAT-PROJET.md).**

## Stack

- **Expo / React Native + TypeScript** — une seule base de code, déployée en
  web statique sur Vercel (`expo export --platform web`) :
  https://opspilot-mu-six.vercel.app/. GitHub Pages est une surface historique.
- **Expo Router** — routing par fichiers dans `app/`.
- **Supabase** — auth, Postgres (RLS multi-tenant par `organization_id`),
  Edge Functions (administration, formation privée, IA, paiements Mollie). Projet de production : **OPS PILOT V2**
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
  migrations/       SQL versionné — lire migrations/README.md AVANT d'y toucher
  functions/        Edge Functions privilégiées ; secrets exclusivement serveur
e2e/                Tests Playwright — testIDs stables obligatoires
__tests__/          Tests unitaires vitest
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

## Vérification et publication

- Les workflows GitHub Actions sont **manuels** (`workflow_dispatch`). La
  contrainte de Lucas est de ne consommer aucune minute : ne pas les déclencher
  ni rétablir leurs événements `push`/`pull_request` pendant cette contrainte.
- Exécuter `npm run quality`, la compilation et les parcours pertinents dans
  l’environnement de travail. Consigner les résultats et les limites dans le dépôt.
- Branche de travail → PR → vérifications locales réussies et build Vercel
  réussi → fusion. L’intégration Git Vercel publie `main` ; vérifier le commit
  réellement servi sur le domaine public et les parcours concernés.
- Les migrations et fonctions Supabase ne se déploient pas automatiquement
  avec le web. Les appliquer séparément sur le projet confirmé, conserver leur
  contenu exact dans le dépôt et vérifier leur état après application.
- Les migrations doivent être **idempotentes** ; les fichiers historiques
  explicitement périmés sont exclus (voir `supabase/migrations/README.md`).
- Facturation actuelle, contrôles Mollie, SEPA désactivé et étapes Qonto manuelles :
  [QONTO.md](QONTO.md). Les anciens checkouts/portails Stripe renvoient 410 ;
  ne pas les réactiver comme solution de repli.

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

- Branche de travail → PR vers `main` ; les contrôles locaux et le build Vercel doivent réussir avant fusion.
- Prettier appliqué partout (`format:check` bloque la CI).
- Textes UI en français ; messages d'erreur passés par `utils/error.ts`.
