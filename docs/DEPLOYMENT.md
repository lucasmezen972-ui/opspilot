# Déploiement OpsPilot

Le site web utilise Vercel et le dépôt GitHub `lucasmezen972-ui/opspilot`.
Le build est `npm run build:web`, le répertoire publié est `dist` et les routes
sont configurées dans `vercel.json`. La base URL Expo est vide pour une publication
à la racine du domaine. Node 24 est déclaré dans `package.json`.

Les opérations backend ciblent uniquement Supabase `hpqfmuzkkxrqoqoabjmb`.
Les migrations doivent être idempotentes et le SQL appliqué doit correspondre au
fichier versionné. Vérifier séparément leur présence en production : une PR ne
prouve pas qu'une migration a été appliquée.

Les workflows GitHub Actions sont désormais déclenchés manuellement pour éviter
la consommation automatique de minutes. Ne pas les relancer sans nécessité.
Exécuter localement `npm run quality`, `npm run build:web` et les tests Playwright
avec `PLAYWRIGHT_BASE_URL=http://localhost:3000/`. Un navigateur Chromium peut être
fourni via `PLAYWRIGHT_CHROMIUM_PATH`.

L'ancienne URL GitHub Pages n'est plus la cible de vente. Elle peut encore servir
l'ancienne interface tant qu'un retrait ou une redirection n'est pas effectué.
Le backend de cette ancienne interface bénéficie néanmoins des restrictions de
droits et ne peut plus créer de paiement Stripe.

Une migration de routage nécessite également la vérification des URL de retour
Supabase Auth et du lien de récupération de mot de passe. Ne pas annoncer le
parcours de récupération comme validé sans cet essai.
