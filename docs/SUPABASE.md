# Supabase — OpsPilot

Projet **OPS PILOT V2** `hpqfmuzkkxrqoqoabjmb` (eu-west-3).

## Modèle de données

Multi-tenant : la quasi-totalité des tables porte un `organization_id` et
est protégée par **RLS** (un membre ne voit que son organisation). Domaines
principaux : organisations / magasins / profils ; audits (templates,
sections, items, réponses, photos) ; actions correctives ; produits ;
tâches ; formations (chapitres, quiz, progression) ; messagerie ;
abonnements. Tables plateforme (back-office) : `admin_audit_log`,
`platform_settings`, `email_log`, `announcements`, `app_settings` — RLS
sans policy = **service_role uniquement**.

## Edge Functions

Toutes en `verify_jwt=false` (auth applicative dans le code), imports via
**`npm:`** (jamais esm.sh — source d'échecs de bundling) :

- `admin-api` — API du back-office (auth manuelle superadmin/support + aal2
  si 2FA ; service_role jamais exposé au navigateur).
- `ai-assistant` — assistant métier (Anthropic, rate-limité). Nécessite le
  secret `ANTHROPIC_API_KEY` (sinon mode dégradé).
- `send-transactional`, `email-worker` — emails (Resend). Clé/expéditeur en
  base (`platform_settings.email_provider`), rotables au back-office.
- `create-checkout-session`, `create-customer-portal`, `stripe-webhook`
  (+ `stripe-worker`, `stripe-setup`) — Stripe.

## Crons (pg_cron)

- `stripe-sync-worker` (chaque minute).
- `trial-reminder-worker` (08:00 UTC) — relances d'essai via `email-worker`.

Auth des workers : jeton `x-worker-token` généré **en base** et lu par le
cron / les triggers ; jamais exposé.

## Secrets (noms uniquement)

`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`ANTHROPIC_API_KEY`, `RESEND_API_KEY`/`EMAIL_FROM` (optionnels : la base
prime). Pattern de gestion des secrets côté produit : valeur en
`platform_settings`, champ **write-only** au back-office, statut booléen en
lecture.

## Migrations

Dans `supabase/migrations/` (voir son `README.md`). Règles :

- **Idempotentes** uniquement (`CREATE OR REPLACE`, `IF NOT EXISTS`,
  `ON CONFLICT DO NOTHING`). Jamais de changement de type de retour d'une
  fonction sans `DROP` préalable (cause historique de CI rouge).
- Deux fichiers historiques sont volontairement sautés par les workflows.
- Toute migration appliquée en direct (MCP/dashboard) doit être committée à
  l'identique.
- Les fonctions internes ne doivent pas être exposées en RPC public
  (cf. révocation `20260612090000`).
