# OpsPilot — Carte d'état du projet

> Document d'accueil pour tout agent (Claude, Codex…) ou développeur qui
> reprend le projet. Mis à jour le 2026-11-03. À lire AVANT toute
> intervention, avec `docs/DEVELOPER.md` (architecture/conventions) et
> `supabase/migrations/README.md` (règles migrations).

## Visibilité des actions — correction du 3 novembre 2026

Après la PR 236, Lucas demande des actions plus reconnaissables : la sobriété ne
doit pas laisser hésiter entre une commande et une information. Les accès ont un
contour visible, une flèche et un titre bleu ; les boutons secondaires sont
encadrés. Les compteurs restent statiques. Les commandes indisponibles sont
grisées, avec cadenas sur les boutons partagés et état d’attente explicite.

Les accès terrain sont de vrais liens web, utilisables avec Entrée. Le bouton
d’ajout d’un produit reste indisponible sans nom obligatoire. La composition et
l’identité précédentes sont conservées. Règles, preuves et limites :
[DESIGN-ACTIONS-2026-11-03.md](DESIGN-ACTIONS-2026-11-03.md). La PR de cette
correction conserve les résultats et identifiants exacts de publication.

## Finition identité et composition — 3 novembre 2026

La passe suivant la PR 234 unifie la marque, charge Instrument Sans localement,
répartit l’accueil en colonnes selon la largeur disponible et retire le résumé
d’alertes répété. Connexion, cockpit, outils, profil et navigation sont harmonisés.
Les états erreur/chargement restent explicites, la traçabilité est dépliable au
clavier et les parcours métier existants sont conservés.

La reprise s’effectue dans une copie isolée du candidat initial, conservé intact.
Contrôles et limites : [DESIGN-IDENTITY-2026-11-03.md](DESIGN-IDENTITY-2026-11-03.md).
La publication exacte est suivie dans la PR de cette passe. Aucun changement
serveur, bancaire, média ou Cloudflare ; aucun usage de GitHub Actions.

## Espace client TRADIKOM — raccordement serveur du 3 novembre 2026

Les achats confirmés peuvent désormais alimenter une file commerciale privée
destinée à l’espace TRADIKOM commun. Le premier contact est ancré depuis une
facture payée et son demandeur administrateur/owner dont l’e-mail est vérifié.
Les essais et les employés ne créent pas d’accès commercial. Les messages
conservent leur identifiant et leur révision ; les reprises utilisent un bail.

Les migrations `customer_portal_sync` et
`customer_portal_worker_token_compatibility` sont appliquées sur OPS PILOT V2,
versions distantes **20261103195531** et **20261103200052**. La fonction
`customer-portal-sync` est **ACTIVE v2**. Le jeton interne existant est une
chaîne JSON ; le nouveau raccordement accepte cette représentation et l’objet
historique sans faire tourner la clé ni modifier les autres workers.

Huit tests Node passent, ainsi que la recette SQL réelle en transaction annulée.
Les appels HTTP réels donnent 401 sans jeton, 403 avec Origin navigateur et 503
`sync_unavailable` avec le bon jeton tant que le drapeau est désactivé.
Les deux tables ont RLS et aucun droit client ; la recette SQL annulée ne
laisse aucun résidu. Les nouvelles fonctions restent réservées au service_role.

**La liaison OpsPilot est activée**, après confirmation de Lucas et configuration
de la clé dédiée dans Vault et Cloudflare. La réception signée, la livraison par
le worker, les doublons, la résiliation et le rejeu d’un ancien état ont été
vérifiés réellement. Le contact initial reste seul autorisé ; la file n’a aucun
message en attente ou à examiner. Un dossier clairement marqué TEST reste
résilié avec deux reçus ; la confirmation native de suppression a expiré pendant
la déconnexion de l’ordinateur. Aucun achat existant n’est importé, aucun paiement,
facture ou e-mail réel n’est émis. Le portail TRADIKOM (PR 25) affiche Mes services
sur son domaine public ; le cycle d’achat TRADIKOM ONE et la connexion unique
restent des travaux séparés. Contrat, activation et preuves :
[CUSTOMER-PORTAL.md](CUSTOMER-PORTAL.md).

## Revue design transverse — candidat vérifié du 3 novembre 2026

La reprise porte sur l’interface web au-delà de la formation : menu latéral dès
1 024 px, zone centrale bornée à 1 280 px, grilles adaptées à la largeur utile,
hiérarchie des priorités, contrastes sémantiques et repères clavier. Les listes
Audits/Tâches défilent avec leurs contrôles en paysage. Les cartes de tâches
n’exposent plus un bouton sans action ; l’identité de profil et le pied des cartes
kanban peuvent se répartir sur plusieurs lignes.

Les fenêtres de formulaire sont bornées et défilables selon leur contenu. Les
champs partagés ciblés disposent de labels persistants, d’un texte de 16 px et
d’une hauteur minimale de 48 px. La caméra globale sans rattachement à un audit
est supprimée ; la capture reste disponible sur les cartes d’audit. Les API,
permissions, données métier et médias de formation ne changent pas.

Les contrôles visuels couvrent **375 × 812, 768 × 1 024, 812 × 375 et
1 440 × 960**, avec démo locale et sessions fictives dont les API sont interceptées.
**376 tests unitaires sur 63 fichiers et 86 scénarios Chromium distincts passent**,
avec TypeScript, ESLint, formatage et compilation web réussis. Les scénarios
navigateur passent en deux lots de 43 sur la même compilation. La publication
et son déploiement sont suivis dans la PR de cette livraison. La préférence de
réduction des mouvements est activée dans les captures, sans revendication de
suppression de toutes les animations ni audit natif iOS/Android.

Périmètre, limites et référence des résultats finaux :
[DESIGN-2026-11-03.md](DESIGN-2026-11-03.md). Les sections suivantes conservent
l’historique des livraisons précédentes.

## Parcours internes texte + vidéo — reprise du 3 novembre 2026

Dix programmes associent chacun une capsule narrée et sous-titrée, trois chapitres
écrits, un exercice corrigé et six questions finales. Le catalogue couvre les
formations internes selon le poste et les risques ; les démarches des organismes
et habilitations officielles restent exclues. Les pratiques au poste restent à
organiser par l’employeur ; aucune certification Qualiopi n’est revendiquée.

Les deux migrations du catalogue sont présentes sur OPS PILOT V2 sous
`20261103172837` et `20261103172906`. Dix médias privés et dix corrigés serveur
sont chargés : **14 820 706 octets attendus et stockés**, bucket `training-library`
privé. `training-content-release` est ACTIVE v2. L’import ne copie pas les cours
chez les clients ; chaque responsable choisit les programmes de son organisation.

Le correctif `training_unique_video_coverage`, version distante `20261103173636`,
compte les segments vidéo distincts avec borne de temps serveur : répéter une
portion ne gonfle plus le visionnage. Le crédit historique est conservé une fois,
sans réécrire les chapitres validés, XP ou attestations. Des versions différentes
d’un programme peuvent garder leur titre ; la copie des anciens cours est préservée.

Quatre scénarios SQL passent sur Supabase réel en transactions annulées : copie
et isolation du catalogue/médias, couverture vidéo, versions et correction
serveur avec XP unique/attestation. Aucun résidu des fixtures SQL. Onze scénarios
et le rejeu des migrations passent localement ; l’import Deno passe ses quatre
étapes. Qualité/compilation réussies et **371 tests unitaires** passent. Les trois
nouveaux parcours navigateur passent à 375 et 1440 pixels avec les vraies capsules,
lecture partielle Range, quiz et attestation fictive. Les API de ces tests UI sont
interceptées ; les contrôles SQL réels sont une preuve distincte. Régression et
publication finale : voir [FORMATION-PARCOURS.md](FORMATION-PARCOURS.md).

Le serveur SEPA sélectionne désormais une méthode bancaire réellement proposée
(Pay by Bank prioritaire, iDEAL possible), refuse la carte pour un mandat SEPA et
maintient le contrôle des reversements. Les deux fonctions récurrentes sont ACTIVE
v2. En test, Mollie propose directdebit et iDEAL pour la première séquence ; en
production zéro méthode récurrente. Secrets dédiés absents et service désactivé.
Qonto reste manuel. Cloudflare est traité dans une autre conversation.

## Reprise audit, vidéo, design et SEPA — 3 novembre 2026

### Finalisation des erreurs de facturation et évaluations connectées

Lucas demande de terminer les autres travaux avant de reprendre Cloudflare.
Le stockage R2 reste désactivé ; ne pas recommencer les tentatives de connexion
pendant cette reprise.

Les erreurs de lecture de factures et d’abonnement ne sont plus présentées comme
une liste vide ou un essai gratuit. Les demandes confirmées par le serveur restent
affichées même si leur actualisation échoue. Les actions attendent une lecture
valide ; les réponses tardives d’un ancien compte sont ignorées, y compris un
lien de règlement retourné après un changement de compte. Le back-office vérifie
les trois lectures (demandes, organisations, calendriers SEPA) avant d’ouvrir les
contrôles d’une facture. Les confirmations manuelles possèdent un verrou local
pendant l’enregistrement. La période réglée est affichée comme une fin d’accès,
sans annoncer un renouvellement automatique.

L’interface de quiz connecté utilise la décision `passed` du serveur. Elle ne
recorrige plus la tentative avec le seuil courant du catalogue, qui peut différer
de celui enregistré lors de son ouverture. Une réponse serveur incomplète ou
interrompue conserve la même tentative et les mêmes choix pour la reprise. Les
choix multiples ne dépendent plus de la présence du corrigé privé. Les cases du
quiz, de l’accord SEPA et de l’administration vidéo exposent leur sélection au
navigateur ; les chargements des boutons exposent leur état occupé.

Contrôles locaux : qualité et compilation web réussies, **358 tests unitaires**
sur 59 fichiers et **64 parcours Chromium** réussis, dont les 19 contrôles ciblés ;
la régression complète est consignée dans [l’audit](AUDIT-2026-11-03.md). Captures de données fictives :
`billing-recovery-375.jpg`, `billing-recovery-1440.jpg` et
`server-quiz-result-375.jpg`/`server-quiz-result-1440.jpg` dans le dossier de preuves.
Ces tests interceptent les API ; ils ne prouvent pas un débit bancaire ni un
rapprochement Qonto distant. Aucune fonction serveur ni migration ne change dans
cette reprise. La PR [#228](https://github.com/lucasmezen972-ui/opspilot/pull/228)
est fusionnée (`cb8d7767`) ; Vercel est `READY` sur ce commit
(`dpl_6t9VbwXSRFaXz25K7P7sCkn1tW19`) et le domaine public sert cette version.
Le catalogue et l’import vidéo ont été rouverts après rechargement. La sélection
de la réponse A est exposée comme cochée et la limite reste 50 Mo, sans R2 activé.
La prévisualisation est protégée par la connexion Vercel ; aucun contournement
de cette protection n’a été effectué.

Le contrôle au clavier sur la version publique a révélé un complément : la barre
d’espace n’activait pas les radios/checkboxes de `TouchableOpacity` sous RN Web.
`ChoiceControl.web.tsx` utilise `Pressable` et traite explicitement Espace, sans
double activation ni défilement involontaire ; Entrée reste gérée par RN Web.
La version native conserve `TouchableOpacity`. Les six parcours concernés passent
avec Espace/Entrée (quiz, accord SEPA, choix mensuel/annuel, réponse de l’import
vidéo), sur téléphone et ordinateur. La PR
[#229](https://github.com/lucasmezen972-ui/opspilot/pull/229) est fusionnée
(`e3b58254`) ; le domaine public sert ce commit en état Vercel `READY`
(`dpl_13LPgXfFDMnGX7DFsFrNju67oPuH`). Le contrôle distant confirme Espace → B
cochée, puis Entrée → A cochée dans le formulaire d’import. Le formulaire a été
fermé sans publication ni téléversement. La capture
[`production-video-keyboard.jpg`](evidence/2026-11-03/production-video-keyboard.jpg)
et le [relevé de validation](evidence/2026-11-03/finalisation-validation.json)
conservent la preuve et ses limites ; la description de la PR est aussi à jour.
Le README et les consignes de livraison ont été alignés : attestations internes,
Vercel en production, Actions manuelles et migrations Supabase séparées du web.

Nouveau contrôle Mollie : le profil confirmé retourne `status=verified`, mais
la liste réelle des méthodes récurrentes retourne toujours **zéro méthode**.
Le statut du profil ne prouve pas l’autorisation des reversements de l’organisation.
Le SEPA reste désactivé et la demande d’activation existante n’est pas renouvelée.
La création des factures et le rapprochement bancaire Qonto restent manuels.

### Stockage vidéo étendu R2

À la demande de Lucas, le code ajoute R2 pour les nouveaux MP4 privés, jusqu'à
250 Mio par fichier, avec réserve globale de 8 Go et vérification serveur avant
publication. Les objets Supabase existants restent pris en charge. R2 reste
**désactivé tant que le compte, le bucket privé, les accès serveur et le test
prestataire réel ne sont pas validés**. La session Cloudflare disponible affiche
une page de connexion ; aucune souscription ni modification de facturation
Cloudflare n'a été faite. Le quota gratuit du compte n'est pas un forfait illimité.
Configuration et limites : [VIDEO-R2.md](VIDEO-R2.md).

La PR [#226](https://github.com/lucasmezen972-ui/opspilot/pull/226) est fusionnée
(`3a9f3c94`) ; Vercel sert ce commit en état `READY` et le catalogue/import ont
été rouverts en ligne. La migration R2 porte la version en base `20261103120614`
et `training-media` est `ACTIVE` v1. Les appels non authentifiés sont refusés
en 401, les méthodes interdites en 405. La configuration et les réservations
restent inaccessibles aux clients ; aucun objet R2 n'est réservé et le drapeau
reste faux. `training_integrity.sql` passe de nouveau sur la base réelle en
transaction annulée, après le changement du garde de publication.

La connexion Google choisie par Lucas a été tentée : Cloudflare a renvoyé
« Unable to sign in. Try again or use your email and password. ». Aucun bucket,
jeton S3, abonnement ni moyen de paiement Cloudflare n'a été créé. Il faut
rétablir l'accès au compte avant les étapes de configuration et le test R2 réel.

Vérifications locales de cette intégration : 351 tests unitaires, quatre tests
Deno R2, huit scénarios SQL avec rejeu des migrations, et neuf parcours Chromium
ciblés dont import/reprise/lecture R2 à 375 et 1440 pixels. Les appels R2 des
tests sont interceptés ; aucune capacité de stockage réelle supplémentaire
n'est annoncée avant activation du compte et vérification distante.

### Socle publié

Branche `codex/audit-sepa-video-20261103`, base `c3a2e01`.
Les changements comprennent la correction serveur des quiz/XP/attestations,
les accès des comptes inactifs et organisations suspendues, les invitations et
la création d’organisation, les injections HTML/CSV et les écritures rejouées.
Le lecteur vidéo comporte import MP4 privé, chapitres, reprise, progression et
administration de publication. Le catalogue et la facturation ont été vérifiés
sur ordinateur, téléphone, tablette et téléphone en paysage.

Preuves locales : **350 tests unitaires**, **55 tests Chromium** (45 de
régression et 10 nouveaux parcours), **7 tests Deno**, six scénarios SQL et
rejeu des quatre migrations. Aucune minute GitHub Actions utilisée. Les
API de comptes fictifs sont interceptées dans les tests navigateur ; ce n’est
pas une preuve de paiement bancaire bout en bout. Voir
[AUDIT-2026-11-03.md](AUDIT-2026-11-03.md) et ses limites.

Le cycle SEPA est préparé, **désactivé** et non opérationnel : zéro méthode
récurrente réelle retournée par Mollie, secrets récurrents de test/réel non
configurés et pas de nouvelle preuve d’autorisation des reversements. La
demande d’activation existante n’a pas été répétée. Le rapprochement des
renouvellements exige la référence et la période exactes de la facture Qonto ;
la création des factures et le rapprochement bancaire Qonto restent manuels.

La PR [#223](https://github.com/lucasmezen972-ui/opspilot/pull/223) a été
fusionnée dans `main` (`eeb9287a`) et Vercel sert ce commit en état `READY` sur
https://opspilot-mu-six.vercel.app/. La connexion démo, le catalogue de
formation et la modale de cours ont été rouverts dans le navigateur après la
publication. Les fonctions indépendantes `admin-api` v13, `ai-assistant` v5 et
`openai-proxy` v3 sont actives dans Supabase.

La confirmation Supabase a abouti lors de la reprise suivante : les quatre
migrations sont appliquées et les fonctions `mollie-recurring` et
`mollie-recurring-webhook` sont `ACTIVE`, version 1. Versions en base :
`20261103111435` (formation/vidéo), `20261103111508` (accès/index),
`20261103111537` (SEPA) et `20261103111545` (onboarding). Les fichiers SQL de
la PR #223 sont inchangés ; les horodatages attribués par le connecteur diffèrent.
Une cinquième migration, `rate_limit_clock_integrity`, appliquée en base sous
`20261103112046`, corrige le limiteur de requêtes commun aux API IA/facturation :
sa variable `current_time` était interprétée comme le mot-clé SQL `CURRENT_TIME`
(heure sans date), ce qui faisait échouer les appels autorisés.

Le test `training_integrity.sql` est passé sur le projet réel avec deux
identités et organisations fictives, dans une transaction annulée : réponses
masquées, score serveur, XP unique, attestation, isolation, vidéo non validée
par saut, suspension et désactivation. Aucune fixture ne subsiste. Le bucket
MP4 est privé (50 Mo) et les écritures directes de résultats/attestations sont
refusées. Les sept scénarios SQL et le rejeu des cinq migrations passent à nouveau
localement, ainsi que neuf parcours Chromium ciblés (vidéo et facturation).

Les fonctions SEPA répondent réellement 401 sans session, 405 pour une méthode
interdite et 400 pour une notification invalide. Le limiteur passe son test sur
le projet réel (appels autorisés, plafond et nouvelle fenêtre). Une notification
inconnue avec un faux statut payé n'ajoute aucun paiement ; un corps trop gros
est refusé en 413. Le drapeau récurrent reste
faux et les accès dédiés test/réel sont absents. Aucun prélèvement ni facture
réelle n'a servi aux tests. Le catalogue a été rouvert dans le navigateur en
ligne ; les tests automatisés contre Vercel n'ont pas pu charger le site depuis
le runtime de test. L'import privé connecté reste testé par API interceptée,
sans nouveau téléversement distant de média dans cette reprise.

## Vérifications antérieures des 2 et 3 novembre 2026

Application de référence : https://opspilot-mu-six.vercel.app/ (Vercel). Les correctifs de sécurité et la facturation Qonto ont été complétés par un raccordement Mollie côté serveur : secrets chiffrés, liens associés aux vraies factures et activation après vérification du paiement. Les 330 tests unitaires, la qualité, la compilation et les invariants SQL sont vérifiés. Un paiement carte simulé est allé jusqu’au webhook et à la base, sans activer un abonnement réel. Mollie contrôle encore le compte : les reversements ne sont pas autorisés au dernier contrôle et les paiements réels restent bloqués dans OpsPilot. Fin de contrôle annoncée d’ici le 5 novembre 2026, estimation du prestataire. Voir [QONTO.md](QONTO.md) pour le parcours, les limites et les preuves.

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
