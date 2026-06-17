# Audit produit premium OpsPilot

Audit réalisé sur `main` après stabilisation locale. Objectif : vérifier si
OpsPilot peut être présenté à un directeur de réseau, un franchisé alimentaire
ou un investisseur sans donner une impression de prototype fragile.

## État de départ constaté

- `npm run quality` échouait sur `format:check` à cause de
  `app/(tabs)/commercial.tsx`.
- `npm run build:web` passait, avec `basePath /opspilot`, mais le script local
  ne produisait pas exactement l'artefact GitHub Pages : back-office statique,
  `404.html` SPA et `.nojekyll` étaient uniquement ajoutés par workflow.
- Lint : 0 erreur, mais 34 warnings après la première correction Prettier
  (imports inutilisés, ordre d'import, promesses lancées via `void`,
  coalescence `||` ambiguë).
- Le produit est fonctionnel et riche, mais certains libellés restaient proches
  d'un dashboard SaaS générique : "KPIs du jour", "Offre commerciale",
  "Back-office", "Connexion Démo".

## Bloqueurs critiques corrigés

- CI locale : Prettier corrigé, lint ramené à 0 warning, typecheck vert.
- Build web local : `npm run build:web` génère maintenant aussi
  `dist/admin`, `dist/404.html` et `dist/.nojekyll`, comme l'artefact publié.
- GitHub Actions : le workflow Pages utilise Node 24, aligné avec le workflow CI
  et les contraintes d'engine de dépendances.
- Promesses ignorées : les appels de journal d'activité, accusés de lecture,
  chargements back-office et scan fallback gèrent désormais les erreurs au lieu
  d'être masqués par `void`.
- Faux positif secret : le placeholder OpenAI ne ressemble plus à une clé `sk-*`.

## Ce qui fait encore "app SaaS générique"

- Certains écrans secondaires restent très "liste + cartes" et gagneraient à
  raconter davantage le contexte terrain.
- Le dashboard manager et le back-office ont encore des surfaces proches d'une
  admin table, même si les données sont crédibles.
- Plusieurs modules métier sont riches mais longs : l'écran peut encore
  demander trop d'effort avant de comprendre l'action prioritaire.

## Ce qui a été rendu plus humain et premium

- Accueil : bascule vers un "Carnet de bord terrain" qui met en avant ce qui
  compte aujourd'hui plutôt que de parler en KPI abstrait.
- Auth démo : wording plus sérieux, sans emoji, orienté "démo terrain guidée".
- Hub Plus : libellés métier plus clairs pour un manager :
  "Actions à sécuriser", "Présenter OpsPilot", "Pilotage clients".
- Page commerciale : discours orienté valeur terrain : moins d'oublis, plus de
  preuves, équipes sécurisées, vente sans faux paiement.
- Tokens : ajout d'accents chauds maîtrisés (`fieldWarm`, `fieldAmber`,
  `trustGreen`) sans remplacer l'identité bleue OpsPilot.

## Améliorations business prioritaires

1. Rendre le cockpit manager plus narratif : "à faire maintenant",
   "à surveiller", "bien maîtrisé".
2. Ajouter une vue de démonstration guidée qui enchaîne audit, non-conformité,
   preuve, validation manager, formation et rapport.
3. Afficher une synthèse commerciale "ce que le manager gagne / ce que
   l'équipe comprend / ce que la direction peut prouver".
4. Clarifier dans l'app les modules réellement branchés Supabase vs fallback
   démo, sans polluer l'expérience opérationnelle.

## Risques techniques à suivre

- Supabase : les migrations et RPC semblent structurées, mais les règles RLS
  doivent être vérifiées en environnement de staging avec plusieurs
  organisations réelles.
- OpenAI côté web : le client `lib/openai.ts` reste un reliquat à isoler côté
  Edge Function avant tout usage production.
- `npm install` signale des vulnérabilités npm historiques : audit de
  dépendances à traiter séparément pour éviter un `audit fix --force` risqué.
- Les E2E protègent les parcours principaux, mais doivent continuer à couvrir
  les scénarios "investisseur" : page commerciale, mode démo, back-office,
  actions avec preuves, formations longues.

## Score honnête après ce lot

| Axe             |  Score |
| --------------- | -----: |
| Démo client     | 82/100 |
| MVP vendable    | 75/100 |
| SaaS pilote     | 67/100 |
| SaaS production | 55/100 |
| SaaS premium    | 62/100 |

Lecture : OpsPilot est déjà crédible en démo et peut soutenir un pilote, mais
la production premium demande encore une validation sécurité/RLS, une preuve
de scalabilité Supabase et une narration produit plus guidée sur les parcours
dirigeants.
