# Migrations OpsPilot

Projet de référence : **OPS PILOT V2** (`hpqfmuzkkxrqoqoabjmb`, eu-west-3).
Les workflows `migrate.yml` / `bootstrap.yml` rejouent les fichiers `2026*.sql`
à chaque push sur `main` touchant ce dossier.

## Migrations périmées (sautées par les workflows)

Écrites pour un schéma planifié qui a divergé de l'état réel du projet live —
ne pas les rejouer, ne pas les supprimer (historique) :

- `20260609230000_v2_onboarding.sql` — remplacée par
  `20260610120000_sync_onboarding_rpcs_live.sql` (RPC en jsonb, trial 14 j).
- `20260609250000_v2_audit_templates.sql` — la table live `audit_templates`
  n'a pas de colonne `icon` ni de table `audit_template_items` ; 3 templates
  étaient déjà seedés. Elle est remplacée par
  `20260611120000_professional_audits.sql`, compatible avec le schéma live.

## Audits professionnels

`20260611120000_professional_audits.sql` ajoute les modèles structurés,
les réponses typées, les politiques RLS et quatre modèles métier par défaut.
Elle conserve `audit_items` pour compatibilité, mais l'application utilise
désormais `audit_template_items`.

## Formations professionnelles

`20260611180000_professional_trainings.sql` ajoute les chapitres, les quiz,
la progression par chapitres lus, les politiques RLS et quatre cursus métier
complets. Les cursus par défaut sont copiés dans les organisations existantes
et lors de toute nouvelle création d'organisation.

## Assistant IA

`20260611210000_ai_assistant_rate_limit.sql` ajoute un compteur distribué
réservé au `service_role`. Il protège la fonction Edge `ai-assistant` sans
exposer de table ou de RPC au client.

## Règles

- Toute nouvelle migration doit être **idempotente** (rejouable sans erreur) :
  `CREATE OR REPLACE`, `IF NOT EXISTS`, `ON CONFLICT DO NOTHING`…
- Toute migration appliquée directement sur le projet (MCP/dashboard) doit
  être committée ici avec le même contenu.
