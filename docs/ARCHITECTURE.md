# Architecture OpsPilot

Plateforme SaaS B2B de conformité terrain. Une seule base de code (Expo
React Native + TypeScript) déployée en **web statique** sur GitHub Pages,
adossée à **Supabase** (Postgres + Auth + Edge Functions).

## Vue en couches

```
app/                Routes Expo Router (1 fichier = 1 écran). Les écrans
  (tabs)/           sont des ORCHESTRATEURS : état de navigation + appels
                    de hooks. La logique réutilisable vit ailleurs.
features/<domaine>/ Découpage par domaine métier (audits, actions, products,
  components/        training…) : composants, hooks de données, services,
  hooks/             types, constantes propres au domaine.
  ...
shared/             Design system transverse.
  styles/tokens.ts   Source unique : couleurs, espacements, rayons, ombres,
                     typographie, palette de statut.
  components/        Primitives App* (AppKpiCard, AppStatusBadge,
                     AppEmptyState, AppLoadingState…).
hooks/              Hooks data globaux (1 par table) + AuthContext.
lib/                supabase.ts (client + types), demoData.ts, demoStore.ts.
components/         Composants transverses hérités (AuthScreen, RequireRole,
                   GlobalErrorBoundary, CameraModal…).
utils/             error.ts (mapSupabaseError), logger.ts, exports…
supabase/          migrations/ (rejouées par CI) + functions/ (Edge).
e2e/               Playwright. __tests__/ : vitest.
```

## Flux de données

UI (écran) → hook de données (`useAudits`, `useProducts`…) → client
Supabase (`lib/supabase.ts`) → Postgres avec **RLS multi-tenant** par
`organization_id`. Les erreurs passent par `mapSupabaseError` (messages FR
clairs). `GlobalErrorBoundary` capture les exceptions de rendu.

## Mode démo (contrat critique)

Deux modes selon la disponibilité de Supabase au clic « Connexion Démo » :

- **Démo en ligne** : vraie session Supabase, données de l'org démo.
- **Démo locale** : Supabase injoignable → `isLocalDemo = isDemoMode &&
!session`. Les hooks basculent sur `lib/demoStore.ts`, un store
  `useSyncExternalStore` **partagé** entre tous les écrans. Le flag est
  persisté en `localStorage` (`opspilot_demo_mode`) : reload et deep-link
  restent connectés.

Pièges à ne jamais réintroduire : poser une fausse session en démo locale ;
supprimer `demoModeRef` (AuthContext) ; supprimer `utils/alertPolyfill.ts`
(react-native-web n'implémente pas `Alert.alert`).

## Design system

`shared/styles/tokens.ts` est la source unique de vérité visuelle, fidèle à
l'identité OpsPilot. Les composants `App*` consomment ces tokens et sont
introduits **au fil de leur application** aux écrans (pas de composant
inutilisé). Voir `docs/TECHNICAL_AUDIT.md` pour le plan de montée en gamme.

## Référence

- Conventions et pièges : `docs/DEVELOPER.md`
- Inventaire détaillé : `docs/ETAT-PROJET.md`
- Supabase : `docs/SUPABASE.md` — Déploiement : `docs/DEPLOYMENT.md` —
  Tests : `docs/TESTING.md`
