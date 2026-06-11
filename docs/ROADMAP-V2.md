# OpsPilot V2 — Cadrage SaaS B2B

> Plateforme de pilotage opérationnel des magasins et réseaux multi-sites.
> Cible : retail, GMS, franchises, restauration. Concurrents : YOOBIC, SafetyCulture.

---

## 1. État des lieux (audit du 2026-06-09)

### Ce qui existe déjà — et c'est solide

| Domaine            | État                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| Base multi-tenant  | ✅ `organizations` → `stores` → `departments`, toutes les données scopées par `organization_id`        |
| Plans d'abonnement | ✅ `organizations.subscription_plan` (basic/pro/enterprise) + `max_users`/`max_stores`                 |
| RLS                | ✅ 17/20 tables avec policies par organisation et hiérarchie de rôles (admin > manager > employé)      |
| Rôles              | ✅ 4 niveaux dans `profiles.role`                                                                      |
| Modules métier     | ✅ Audits, Tâches, Produits/DLC (scan), Formation, Chat, Dashboard manager — requêtes Supabase réelles |
| Offline            | ✅ File de sync AsyncStorage (`useOfflineSync`)                                                        |
| PWA                | ✅ Manifest, service worker, installation écran d'accueil (PR #56/#57)                                 |

### Problèmes à corriger en priorité

1. **🔴 Secrets en dur** — `lib/supabase.ts:3-11` et `server/supabase.ts:3-8` contiennent l'URL
   et la clé anon en fallback. À supprimer une fois les variables d'env configurées partout
   (GitHub Secrets pour le déploiement). **Faire la rotation des clés dans le dashboard Supabase.**
2. **🔴 Auth API faible** — `server/middleware/auth.ts` : un seul token statique, pas de scopes.
3. **🟡 Policy `badges` ouverte** — `USING (true)` accessible sans authentification
   (`20250909041414_turquoise_garden.sql:799`).
4. **🟡 Pas de traçabilité** — aucune table `audit_log`, pas de `created_by`/`updated_by` :
   bloquant pour HACCP/conformité.
5. **🟡 Quotas non appliqués** — `max_users`/`max_stores` stockés mais jamais vérifiés.

---

## 2. Architecture cible

```
┌─────────────────────────────────────────────────────┐
│  PWA (Expo Router, output static)                   │
│  Mobile / Tablette / Desktop — install sans store   │
└──────────────┬──────────────────────────────────────┘
               │ supabase-js (RLS) + API Express
┌──────────────▼──────────────────────────────────────┐
│  Supabase (eu-west-3)                               │
│  Auth · PostgreSQL multi-tenant · Storage · Realtime│
│  Edge Functions : webhooks Stripe, rapports PDF,    │
│  alertes DLC (cron), invitations e-mail             │
└──────────────┬──────────────────────────────────────┘
               │
        Stripe Billing (Checkout + Customer Portal)
```

Choix structurants :

- **Supabase Edge Functions** plutôt qu'un serveur Express à héberger : webhooks Stripe,
  génération PDF, cron d'alertes DLC. Le serveur Express actuel reste pour le dev/l'analyse IA.
- **Stripe Checkout + Customer Portal** : pas d'UI de paiement custom à maintenir.
- **Pré-rendu statique** (déjà en place) : déployable sur GitHub Pages/Cloudflare Pages.

---

## 3. Schéma base de données — tables à ajouter

```sql
-- Invitations (P0)
CREATE TABLE invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'employé',
  store_id uuid REFERENCES stores(id),
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  invited_by uuid REFERENCES profiles(id),
  status text NOT NULL DEFAULT 'pending', -- pending | accepted | expired
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
  created_at timestamptz DEFAULT now()
);

-- Actions correctives (P0) — générées depuis les non-conformités d'audit
CREATE TABLE corrective_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id),
  audit_response_id uuid REFERENCES audit_responses(id),
  title text NOT NULL,
  description text,
  assignee_id uuid REFERENCES profiles(id),
  priority text NOT NULL DEFAULT 'medium', -- low | medium | high | critical
  status text NOT NULL DEFAULT 'open',     -- open | in_progress | done | overdue
  due_date timestamptz,
  resolved_at timestamptz,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Abonnements Stripe (P0)
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid UNIQUE NOT NULL REFERENCES organizations(id),
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  plan text NOT NULL DEFAULT 'trial',  -- trial | essential | business | enterprise
  status text NOT NULL,                -- trialing | active | past_due | canceled
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Journal d'audit (P1) — conformité
CREATE TABLE activity_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id uuid NOT NULL,
  actor_id uuid,
  action text NOT NULL,        -- ex: 'audit.completed', 'action.resolved'
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
```

Modifications de tables existantes :

- `products` : ajouter `expiry_date`, `alert_threshold_days`, index sur `(organization_id, expiry_date)` pour le module DLC.
- `audits` : ajouter `signature_url`, `latitude`, `longitude`, `completed_by`.
- `badges` : remplacer la policy `USING (true)` par un scope organisation.
- Triggers `before insert` sur `profiles` et `stores` pour appliquer `max_users`/`max_stores`.

---

## 4. Roadmap

### MVP (semaines 1-4) — vendable à 299 €/mois

| #   | Lot                 | Contenu                                                                               |
| --- | ------------------- | ------------------------------------------------------------------------------------- |
| 1   | Sécurité            | Rotation clés, suppression secrets en dur, fix policy badges, `activity_log`          |
| 2   | Onboarding          | Inscription → création organisation + magasin, invitations e-mail, gestion des rôles  |
| 3   | Stripe              | Checkout (3 plans), Customer Portal, webhooks, essai 14 jours, application des quotas |
| 4   | Actions correctives | Génération auto depuis non-conformité, vue Liste + Kanban, relances retard            |
| 5   | DLC v1              | `expiry_date` sur produits, écran "produits critiques", alertes J-7/J-3/J-1           |

### V2 (semaines 5-8) — justifie 799 €/mois

- Bibliothèque de modèles d'audit prêts à l'emploi : HACCP, hygiène, sécurité,
  ouverture/fermeture magasin, réception marchandises, contrôle température, contrôle DLC
- Audits enrichis : signature, géolocalisation, photos obligatoires par item
- Dashboard direction : score conformité global/par magasin/par rayon, audits manqués, actions en retard
- Rapports PDF + Excel (Edge Function), envoi hebdomadaire automatique
- Vue Calendrier des actions correctives
- Notifications e-mail (Resend ou SES)

### V3 (semaines 9-12) — Enterprise 1 990 €+/mois

- Consolidation multi-régions (groupes de magasins, responsables régionaux)
- Rapports régionaux et comparatifs inter-magasins
- Exports planifiés, API publique documentée (OpenAPI) avec clés par organisation
- SSO (SAML/OIDC via Supabase Auth)
- Tableaux de bord personnalisables

---

## 5. Backlog priorisé (extrait)

| P   | Tâche                                                            | Fichiers concernés                                                            |
| --- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| P0  | Supprimer les clés en dur                                        | `lib/supabase.ts`, `server/supabase.ts`                                       |
| P0  | Migration `invitations` + `corrective_actions` + `subscriptions` | `supabase/migrations/` (nouveau)                                              |
| P0  | Écran onboarding organisation                                    | `app/onboarding.tsx` (nouveau), `components/AuthScreen.tsx`                   |
| P0  | Intégration Stripe Checkout + webhooks                           | `supabase/functions/stripe-webhook/` (nouveau), `app/(tabs)/profile.tsx`      |
| P0  | Module actions correctives                                       | `app/(tabs)/actions.tsx` (nouveau), `hooks/useCorrectiveActions.ts` (nouveau) |
| P0  | DLC : date de péremption + alertes                               | `app/(tabs)/products.tsx`, `hooks/useProducts.ts`, migration                  |
| P1  | Trigger quotas `max_users`/`max_stores`                          | migration                                                                     |
| P1  | Bibliothèque de modèles d'audit                                  | `data/templates/` (nouveau), seed SQL                                         |
| P1  | Rapports PDF                                                     | `supabase/functions/generate-report/` (nouveau)                               |
| P1  | Invitations e-mail                                               | `supabase/functions/send-invitation/` (nouveau)                               |
| P1  | Journal d'activité                                               | migration + `utils/activityLog.ts` (nouveau)                                  |
| P2  | Vue Kanban/Calendrier actions                                    | `components/KanbanBoard.tsx`, `components/ActionCalendar.tsx` (nouveaux)      |
| P2  | SSO, API publique, multi-régions                                 | V3                                                                            |

---

## 6. Pré-requis immédiats (à faire à la main)

1. **Dashboard Supabase** → régénérer les clés exposées (`service_role`, `sb_secret`).
2. **GitHub** → Settings → Secrets → Actions :
   - `EXPO_PUBLIC_SUPABASE_URL` = `https://hpqfmuzkkxrqoqoabjmb.supabase.co`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = la clé **publishable** (`sb_publishable_...`)
3. **Stripe** → créer le compte, les 3 produits (299/799/1990 €) et récupérer les clés API.
