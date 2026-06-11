# OpsPilot — Carte d'état du projet

> Document d'accueil pour tout agent (Claude, Codex…) ou développeur qui
> reprend le projet. Mis à jour le 2026-06-12. À lire AVANT toute
> intervention, avec `docs/DEVELOPER.md` (architecture/conventions) et
> `supabase/migrations/README.md` (règles migrations).

## Vue d'ensemble

OpsPilot est un SaaS de pilotage des opérations terrain (retail) :
audits, actions correctives, produits/DLC, tâches, formations, messages.

| Surface                  | URL                                                | Code                                  |
| ------------------------ | -------------------------------------------------- | ------------------------------------- |
| Application (clients)    | https://lucasmezen972-ui.github.io/opspilot/       | `app/`, `features/`, `hooks/`, `lib/` |
| Back-office (superadmin) | https://lucasmezen972-ui.github.io/opspilot/admin/ | `admin/` (SPA statique sans build)    |
| API privilégiée          | Edge Function `admin-api`                          | `supabase/functions/admin-api/`       |

- **Supabase** : projet « OPS PILOT V2 » `hpqfmuzkkxrqoqoabjmb` (eu-west-3).
  L'ancien projet us-east-1 est mort — ne jamais l'utiliser.
- **Déploiement** : GitHub Actions sur `main` (CI quality+E2E, Pages,
  migrations, Edge Functions). Branche de travail → PR → CI verte → merge.
- **Comptes notables** : superadmin `lucas.mezen.972@gmail.com` ;
  démo `demo@opspilot.com` (org `550e8400-…0000`).

## Application (état fonctionnel)

- **Audits professionnels** : templates en base (`audit_templates` +
  `audit_template_items`), exécution par sections avec réponses typées
  (`audit_responses`), photos (`audit_photos`), scoring, actions
  correctives automatiques (désactivables par flag).
- **Formations réelles** : chapitres (`training_chapters`) + quiz
  (`training_quiz_questions`), progression, XP/niveaux.
- **Scan produit** : caméra réelle (mobile) / BarcodeDetector (web),
  fallback saisie manuelle. Produits + DLC + stock.
- **Assistant IA** : Edge Function avec rate limit (`ai_rate_limits`).
- **Préférences** : `user_preferences` + réglages org.
- **Mode démo double** : en ligne (vraie session, données org démo) ou
  local (`lib/demoStore.ts` partagé entre écrans quand Supabase est
  injoignable). Contrat sacré — voir DEVELOPER.md (demoModeRef,
  alertPolyfill, fausse session interdite).
- **Feature flags** : `useAppSettings` lit `app_settings` ; le back-office
  active/désactive Rapports, Formation, assistant IA, actions auto par
  organisation, sans déploiement.
- **Annonces** : bannière in-app (`announcements`, RLS) publiée depuis le
  back-office.

## Back-office superadmin (v10)

Vues : 📊 Dashboard (alertes essais, tendances, activité) · 👥 Utilisateurs
(CRUD, reset mdp, suppression, 🕵️ impersonation, dernière activité) ·
🏢 Organisations (CRUD, abonnements, magasins, sparkline, export RGPD,
suppression définitive) · 📢 Annonces · ⚙️ Paramètres (flags + destinataires
des notifications de clôture) · 💳 Facturation (MRR/factures Stripe) ·
🩺 Santé (crons, emails, taille base) · 🛠 Plateforme (durée d'essai par
défaut, clé Resend write-only) · 📜 Journal (`admin_audit_log`, toutes les
actions tracées) · 🔐 2FA TOTP (exigée côté serveur une fois activée) ·
rôle `support` = lecture seule · 🌓 mode sombre.

Sécurité : la clé `service_role` ne quitte jamais le serveur ; tout passe
par `admin-api` (verify_jwt=false, auth manuelle superadmin/support + aal2
si 2FA). Les secrets (`platform_settings` : `email_worker_token`,
`email_provider`) ne sortent JAMAIS par l'API.

## Infrastructure email (complète et active)

- **Expéditeur** : `OpsPilot <contact@tradikom.com>` — domaine
  `tradikom.com` vérifié chez Resend. Clé + expéditeur stockés dans
  `platform_settings.email_provider` (rotation depuis 🛠 Plateforme).
- **Automatismes** :
  - relances d'essai J-3 / expiration (`email-worker`, cron
    `trial-reminder-worker` 08:00 UTC) ;
  - bienvenue / invitation / abonnement actif (triggers →
    `send-transactional`) ;
  - notifications de clôture audit/formation aux destinataires configurés
    par org (`app_settings` : `notify.audit_completed`,
    `notify.training_completed`).
- **Journal** : chaque envoi dans `email_log` (vue 🩺 Santé). Dédup pour
  bienvenue/abonnement uniquement.
- Auth des workers : jeton `x-worker-token` généré EN BASE, lu par le cron
  et les triggers — jamais exposé.

## Inventaire Supabase

- **Edge Functions** (toutes `verify_jwt=false`, auth applicative ;
  imports `npm:` — jamais esm.sh, source d'échecs CI) : `admin-api`,
  `send-transactional`, `email-worker`, `create-checkout-session`,
  `create-customer-portal`, `stripe-webhook`, `stripe-worker`,
  `stripe-setup`, + fonction(s) IA côté produit.
- **Crons (pg_cron)** : `stripe-sync-worker` (1 min),
  `trial-reminder-worker` (08:00 UTC).
- **Secrets d'env** : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  clé IA (selon fonction Codex). `RESEND_API_KEY`/`EMAIL_FROM` optionnels
  (la base prime s'ils sont absents).
- **RPC onboarding** : `create_organization`, `accept_invitation`
  (jsonb, SECURITY DEFINER, authenticated). Helpers santé :
  `admin_cron_status`, `admin_db_size` (service_role).
- **RLS** : multi-tenant par `organization_id` sur toutes les tables
  métier ; tables plateforme (email_log, platform_settings,
  admin_audit_log) sans policy = service_role uniquement.

## Conventions de travail (rappel)

1. Branche → PR vers `main` → CI verte → merge (Lucas a autorisé
   l'auto-merge par l'agent une fois la CI verte).
2. `npm run quality` = typecheck + lint + format:check + vitest — doit
   être vert localement avant push. E2E (36+) dans la CI.
3. Les testIDs sont un contrat E2E. Le mode démo doit rester fonctionnel
   pour toute nouvelle feature (fallback demoStore + spec).
4. Migrations idempotentes uniquement ; deux fichiers historiques sont
   sautés par les workflows (voir migrations/README.md) ; toute migration
   appliquée en direct doit être committée à l'identique.
5. Secrets : jamais dans le code, le journal, ou l'API. Le pattern
   établi : valeur en `platform_settings`, write-only depuis le
   back-office, statut booléen en lecture.
6. Checks « CircleCI » / « Supabase Preview » rouges sur les PR = apps
   GitHub externes sans config, à ignorer (seuls les checks GitHub
   Actions comptent).

## Reste à faire connu

- Cycle Stripe bout-en-bout jamais testé en réel (checkout test →
  webhook → statut active → email de confirmation).
- Rotation de la clé Resend par Lucas (elle a transité par le chat).
- Protection « leaked passwords » Supabase = plan Pro (en attente).
- Site vitrine / centre d'aide / analytics d'usage : non commencés.
