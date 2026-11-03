# OpsPilot — Carte d'état du projet

> Document d'accueil pour tout agent (Claude, Codex…) ou développeur qui
> reprend le projet. Mis à jour le 2026-11-03. À lire AVANT toute
> intervention, avec `docs/DEVELOPER.md` (architecture/conventions) et
> `supabase/migrations/README.md` (règles migrations).

## Vérifications des 2 et 3 novembre 2026

Application de référence : https://opspilot-mu-six.vercel.app/ (Vercel, production READY, commit applicatif `48ea6f6d8ec34507a7cf60c8817e686709c7765a`, PR #218). Les 309 tests unitaires, la qualité, la compilation et 44 parcours navigateur ont été vérifiés localement (38 + 6). Le compte Qonto est connecté et la migration de facturation est appliquée et vérifiée. Le compte Mollie est créé et relié à Qonto ; la connexion au Dashboard est vérifiée et le dossier est en cours de contrôle chez Mollie, avec une fin annoncée d’ici le 5 novembre 2026 (estimation). Les moyens de paiement et reversements doivent encore être confirmés avant d’annoncer l’encaissement pleinement opérationnel. Le rapprochement des règlements reste manuel.

- Les administrateurs clients ne disposent plus des RPC de plateforme. Les modifications directes de rôle, d'organisation et de statut d'un profil sont protégées ; la gestion d'équipe utilise des RPC limitées à l'organisation.
- `platform_settings` est réservé au serveur. Le jeton worker a été renouvelé ; une nouvelle clé Resend limitée à l'envoi depuis tradikom.com remplace l'ancienne clé « Ops pilot », révoquée. Aucune clé n'est reproduite ici.
- Les contrôles SQL `supabase/tests/tenant_access.sql` et `employee_access.sql` ont été exécutés sur le projet réel, dans des transactions annulées.
- La facturation est désormais orientée Qonto ; les anciens checkouts/portails Stripe renvoient 410, le cron Stripe est désactivé. Voir [QONTO.md](QONTO.md) pour les étapes encore nécessaires et la distinction entre code préparé et compte connecté.
- Le cache web ne conserve plus les réponses privées. Une photo fournie doit être téléversée avant clôture d'un audit, d'une tâche ou d'une action corrective.
- Les mentions légales reprennent l'identité vérifiée dans l'API publique Recherche d'entreprises (SIREN 820167914, établissement actif). Conditions professionnelles et annexe de sous-traitance ajoutées ; aucune promesse par défaut de SSO, hébergement dédié ou SLA chiffré.
- Les workflows GitHub Actions sont manuels afin de préserver les minutes du compte. Les vérifications sont exécutées dans l'environnement de travail ; le déploiement web utilise la configuration Vercel à la racine.
- Dépendances : 0 vulnérabilité haute ou critique dans l'audit npm après mise à jour. Des alertes modérées du socle Expo restent à traiter lors d'une montée de SDK dédiée ; ne pas annoncer « zéro vulnérabilité ».

La carte historique ci-dessous décrit le socle antérieur ; les points ci-dessus priment en cas de contradiction.

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
- **Plans d'action correctifs intelligents** : `features/actions/actionPlan.ts`
  génère un plan structuré et déterministe (problème, risque, cause probable,
  action immédiate, action corrective, prévention, preuves attendues,
  checklist, validation/escalade). La deadline dépend du problème détecté :
  chaîne du froid max 1 h, hygiène/DLC max 2 h, prix 24 h, facing/stock 48 h,
  formation 7 jours. Le plan local sert de garde-fou et de repli au plan IA.
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
  `stripe-setup`, `openai-proxy`, `ai-assistant`.
- **Crons (pg_cron)** : `stripe-sync-worker` (1 min),
  `trial-reminder-worker` (08:00 UTC).
- **Secrets d'env** : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `OPENAI_API_KEY` (Edge Function `openai-proxy`),
  `ANTHROPIC_API_KEY` (Edge Function `ai-assistant`).
  `RESEND_API_KEY`/`EMAIL_FROM` optionnels
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

- Optimisations RLS à volume (advisors performance, non bloquant à
  l'échelle actuelle) : wrapper `auth.uid()` en `(select auth.uid())`
  dans ~27 policies, fusionner les policies permissives multiples.

- Cycle Stripe bout-en-bout jamais testé en réel (checkout test →
  webhook → statut active → email de confirmation).
- Rotation de la clé Resend par Lucas (elle a transité par le chat).
- Protection « leaked passwords » Supabase = plan Pro (en attente).
- Site vitrine / centre d'aide / analytics d'usage : non commencés.
