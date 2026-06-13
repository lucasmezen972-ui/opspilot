# Audit technique OpsPilot — Lot 0

> Audit réalisé sur `main` (post-fusion des lots produit). Sert de base au
> nettoyage, à l'humanisation du code et à la montée en gamme premium.
> Compléments : `docs/DEVELOPER.md`, `docs/ETAT-PROJET.md`.

## 1. État actuel

Plateforme SaaS B2B (Expo RN + Expo Router + Supabase, déploiement web sur
GitHub Pages). Fonctionnellement riche : audits structurés, formations +
quiz, produits/scan, tâches, messagerie, back-office superadmin, emails
transactionnels. CI verte (typecheck, lint, prettier, 57 tests unitaires,
43 E2E). Le socle est **stable et déployé** ; l'enjeu du Lot 0 est la
**lisibilité, la cohérence et le premium**, pas la stabilité.

## 2. Métriques relevées

| Signal                       | Valeur                            | Cible Lot 0                            |
| ---------------------------- | --------------------------------- | -------------------------------------- |
| `console.log/info` en prod   | 8                                 | 0 (via `utils/logger`, dev uniquement) |
| `any` explicites             | 41                                | < 15, typés sur les surfaces métier    |
| `catch {}` vides             | 1 (enregistrement SW, acceptable) | inchangé                               |
| `TODO/FIXME`                 | 0                                 | 0                                      |
| Écrans `(tabs)` > 450 lignes | 10                                | orchestrateurs < 250 lignes            |
| Styles de modale dupliqués   | 7 fichiers                        | 1 source partagée                      |
| Assertions E2E faibles       | 0                                 | 0 (déjà durci)                         |

## 3. Principaux risques / dette technique

### 3.1 Logique métier mêlée à l'UI (priorité haute)

Dix écrans dépassent 450 lignes en mélangeant état, appels de données,
rendu et styles :

| Écran                     | Lignes |
| ------------------------- | ------ |
| `app/(tabs)/audits.tsx`   | 1009   |
| `app/(tabs)/index.tsx`    | 817    |
| `app/(tabs)/training.tsx` | 817    |
| `app/(tabs)/tasks.tsx`    | 807    |
| `app/(tabs)/chat.tsx`     | 734    |
| `app/settings.tsx`        | 599    |
| `app/(tabs)/team.tsx`     | 563    |
| `app/(tabs)/profile.tsx`  | 536    |
| `app/(tabs)/billing.tsx`  | 515    |
| `app/(tabs)/manager.tsx`  | 483    |

→ Extraire composants (`features/<domaine>/components`), hooks de données
(`features/<domaine>/hooks`) et constantes ; l'écran devient orchestrateur.

### 3.2 Bruit de logs (priorité moyenne, rapide)

8 `console.log`/`console.info` de débogage subsistent
(`app/_layout.tsx` « APP START »/« ROUTER START », `lib/supabase.ts`
« SUPABASE START »/« client initialisé », `audits.tsx` « Photo prise »).
→ Remplacer par `utils/logger` (silencieux en prod) ou supprimer.

### 3.3 Incohérence visuelle (priorité haute — objectif premium)

Pas de design system : couleurs, espacements, rayons et ombres sont
recopiés en dur dans chaque écran. Les styles de modale sont dupliqués
dans 7 fichiers. Les états vides / erreur / chargement sont traités au cas
par cas.
→ `shared/styles/tokens.ts` + bibliothèque `App*` (Button, Card, Badge,
Input, Modal, EmptyState, ErrorState, LoadingState, KpiCard, StatusBadge…).

### 3.4 Typage à resserrer (priorité moyenne)

41 `any` explicites, surtout sur les payloads de mutation des hooks et les
réponses Supabase.
→ Introduire des types par domaine (`features/<domaine>/types`) et typer
les fonctions de service.

### 3.5 Wording faible (priorité moyenne — premium)

Termes génériques (« Action », « Photo », « Message », « Quiz »…) là où un
vocabulaire métier renforcerait la crédibilité (« Plan d'action correctif »,
« Preuve photo », « Communication interne », « Évaluation »…).

## 4. Fichiers à refactoriser en priorité

1. `app/(tabs)/audits.tsx` (1009) — le plus gros, cœur métier.
2. `app/(tabs)/index.tsx` (817) — dashboard, première impression premium.
3. `app/(tabs)/training.tsx` / `tasks.tsx` (≈800).
4. `app/(tabs)/chat.tsx` (734) — future messagerie officielle.
5. `lib/supabase.ts` — retirer les logs, isoler les types.

## 5. Architecture cible

```
features/<domaine>/        audits, actions, products, training, tasks,
  components/              messages, reports — chacun :
  hooks/                     UI réutilisable, hooks de données,
  services/                  accès Supabase, types, utilitaires, constantes
  types/
  constants/
shared/
  components/              App* (design system : boutons, cartes, badges…)
  styles/tokens.ts         couleurs, espacements, radius, shadows, typo
  constants/ types/ utils/
app/(tabs)/                écrans = orchestrateurs minces
```

Le projet a déjà amorcé `features/` (actions, products, audits, training) :
le Lot 0 généralise et complète, sans casser l'existant.

## 6. Priorités de nettoyage (séquencement Lot 0)

1. **0.2 logs + code mort + `any`** : suppression des `console.log`,
   chasse aux exports inutilisés, resserrage des `any` les plus risqués.
2. **0.3 design system** : `tokens.ts` + composants `App*` + wording
   premium, appliqués d'abord au dashboard et aux audits.
3. **0.4 debug global** : error boundary, traduction des erreurs Supabase,
   états vides/erreur/chargement homogènes, vérification GitHub Pages /
   scan / PDF / mobile.
4. **0.5 tests** : convention de testID `module-action-element`,
   assertions strictes sur les parcours clés.
5. **0.6 docs** : README pro + `ARCHITECTURE.md`, `DEPLOYMENT.md`,
   `SUPABASE.md`, `TESTING.md`, `PRODUCT_ROADMAP.md`.

Chaque étape = une PR validée verte (`quality` + `build:web` + E2E) avant
la suivante. Aucune refonte brutale : montée en gamme progressive.

## 7. Recommandations transverses

- Conserver strictement le contrat mode démo (`isLocalDemo`, demoStore) et
  les testIDs existants à chaque refactor.
- Ne jamais introduire de secret en clair ; le pattern établi
  (`platform_settings` + champ write-only au back-office) reste la règle.
- Tout nouvel export d'un hook mocké doit être ajouté aux mocks des tests
  d'écrans, sinon le typecheck casse.
- Les migrations restent idempotentes ; les fonctions internes ne doivent
  pas être exposées en RPC public (cf. révocation `20260612090000`).
