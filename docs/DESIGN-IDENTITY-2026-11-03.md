# Identité et composition OpsPilot — 3 novembre 2026

## Résultat visuel

Cette passe prolonge la PR 234. Elle conserve le cobalt d’action et les couleurs
sémantiques, avec une structure marine, un signe original et une typographie
Instrument Sans auto-hébergée sous licence OFL. Connexion, attente, menu et icônes
installables partagent cette identité. Aucune nouvelle dépendance.

L’accueil réunit une priorité terrain, une ligne de mesures et, sur ordinateur,
les DLC et audits en colonnes avec un espace secondaire pour les outils personnels.
Le résumé d’alertes répété est retiré ; la traçabilité se déplie sans masquer la
priorité. Les états chargement/erreur ne présentent plus un faux bilan positif.
Le cockpit réunit conformité et suivi opérationnel ; les outils sont regroupés
par usage. Les données métier, permissions et parcours existants sont conservés.

## Reprise et préservation

La reprise utilise une copie isolée du candidat non enregistré de
`codex/design-identity-20261103`. Le dossier initial est conservé sans écriture.
Les modifications de documentation de main concernant le portail sont conservées.
Les anciennes captures de tests hors de identity ne sont pas remplacées : leurs
preuves restent liées à leur livraison historique.

## Validation

Les captures sont produites en démo locale ou avec des API interceptées et des
comptes fictifs. Elles couvrent 320, 375, 768, 812, 1440 et 1920 pixels, avec
redistribution, clavier, traçabilité, formulaires et texte doublé. Chaque zone
modifiée a été revue : accueil, cockpit, connexion, outils, profil et navigation.
Les captures à 320 pixels sont des vues de navigateur, pas des téléphones réels.
Le contrôle du texte doublé est ciblé sur l’accueil et le menu ; il ne constitue
pas une certification WCAG ni un audit exhaustif des lecteurs d’écran.

TypeScript, ESLint, Prettier, 376 tests unitaires et compilation web passent.
Un avertissement ESLint antérieur demeure dans trainingReadState.test.ts.
Huit tests Node de compatibilité du portail passent sans opération distante.
Les 92 scénarios Chromium de la régression complète passent sur la même compilation.
Les empreintes sont détaillées dans
`evidence/2026-11-03/identity/recovery-validation.json`.

Les médias, Supabase, SEPA/Mollie/Qonto, Cloudflare et les workflows ne sont pas
modifiés. Aucune minute GitHub Actions, donnée client créée, paiement ou message
externe. La qualité observée ne signifie ni perfection absolue ni validation native.

## Publication

La livraison doit identifier le SHA candidat, sa prévisualisation READY, puis le
SHA fusionné réellement affecté au domaine public. Les preuves de publication
sont conservées dans la PR ; aucun résultat d’un ancien candidat ne les remplace.
