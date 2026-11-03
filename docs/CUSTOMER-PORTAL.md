# Espace client TRADIKOM commun

Lucas a confirmé le 3 novembre 2026 le rattachement de ses offres Digital, TRADIKOM ONE et OpsPilot au portail existant : https://tradikom.lucas-mezen-972.workers.dev/espace-client.

## Activation vérifiée du 3 novembre 2026

Après confirmation de Lucas, la clé HMAC dédiée est enregistrée dans Supabase Vault
et dans le secret d’exécution Cloudflare. Le drapeau de livraison est **activé**.
La fonction `customer-portal-sync` reste ACTIVE v2 ; aucun secret n’est conservé
dans le dépôt ou dans les variables publiques.

Un premier message signé a reçu HTTP 200 avec `received:true, duplicate:false`.
D1 contient un seul dossier fictif, un seul lien source et un seul membership.
La file OpsPilot a ensuite livré le même événement : HTTP 200,
`delivered:1, retrying:0, review:0`, sans doublon.

La résiliation a été livrée par le worker. Le rejeu de l’ancien état actif n’a
pas réactivé la prestation : D1 reste à `canceled`, révision source 7, avec
un lien, un membership et deux reçus. Le changement d’e-mail présent dans le
message fictif n’a pas ajouté d’accès : le contact initial est conservé.
Le récepteur public refuse toujours les messages non signés (401) et ceux du
navigateur (403). La file est vide de messages en attente ou à examiner.

Le dossier `[TEST] Liaison OpsPilot 6b273500`, son organisation source sans
profil et les deux événements techniques livrés restent identifiés comme
données fictives. La confirmation native de leur suppression a expiré lors
de la déconnexion de l’ordinateur ; aucune suppression n’a eu lieu.
Ce dossier est résilié et n’a émis ni paiement, ni facture ni e-mail réel.

Les achats confirmés suivants peuvent créer ou mettre à jour leur dossier
TRADIKOM. Les achats antérieurs ne sont pas repris automatiquement.
Le cycle d’achat TRADIKOM ONE et la connexion unique restent séparés.

## Cycle serveur OpsPilot

Un abonnement réellement activé par le serveur et une demande de facture marquée payée, avec une référence correspondante et un demandeur administrateur/owner dont l’e-mail d’authentification est vérifié, permettent d’ancrer le contact commercial. Les essais, les boutons du navigateur et les paiements Mollie de test ne suffisent pas. Les salariés ne sont pas invités au portail.

Les modifications suivantes sont enregistrées dans une file privée, dans la transaction métier. Chaque message porte un identifiant stable et une révision croissante. Un événement reçu deux fois ne crée pas deux dossiers ; un ancien état actif ne doit pas remplacer une résiliation. La panne réseau du portail ne revient pas sur le règlement enregistré : l’envoi est asynchrone et reprend après expiration du bail et délai de reprise. Les conflits d’association passent en examen.

Le prix récurrent n’est pas déduit d’un montant de facture ponctuelle : montant contractuel null et fréquence none tant qu’une source périodique vérifiée n’existe pas. Les factures légales restent dans Qonto ; seule leur référence est reprise. Le portail ne crée aucun droit d’utilisation dans OpsPilot et ne remplace pas les contrôles existants de paiement.

## Activation

La migration est additive et laisse le drapeau `platform_settings.customer_portal_sync.enabled` à false. Elle n’importe pas les clients existants. Le job de reprise toutes les cinq minutes vérifie d’abord ce drapeau ; aucune requête réseau n’est émise tant qu’il est désactivé.

La fonction `customer-portal-sync` vérifie le jeton interne existant des workers. Elle ne reçoit ni achat, ni organisation, ni URL de destination dans le corps d’une requête. Seules les lignes privées déjà enregistrées par les triggers sont éligibles. Le serveur source utilise la clé Vault nommée `opspilot_customer_portal_sync_v1`, qui doit correspondre au secret Cloudflare `TRADIKOM_OPSPILOT_SYNC_KEY`. Ces valeurs ne doivent pas être placées dans Git, dans une réponse de l’API ou dans les variables publiques Expo.

Avant activation : appliquer et vérifier le schéma, déployer la fonction, tester un événement fictif sur le récepteur et contrôler le bon dossier, puis seulement configurer les secrets et activer le raccordement. Aucun débit ni facture réelle n’est nécessaire à ces vérifications. Les autorisations natives du fournisseur restent à respecter.

La connexion unique entre applications et la récupération automatique des originaux de facture sont des étapes distinctes. Le raccordement TRADIKOM ONE dépend encore de son propre cycle d’achat confirmé ; aucun événement n’est émis depuis une démonstration ou une simple création de tenant.

## Vérification

`node --experimental-strip-types --test supabase/tests/customer_portal_*.test.mjs` vérifie signature/corps exact, destination fixe, reçu obligatoire, limites, erreurs/reprise et identifiants conservés. Les tests SQL transactionnels doivent être exécutés après application de la migration, sans activer le raccordement ni émettre de message ou paiement réel.

## Reprise vérifiée du 3 novembre 2026

La migration initiale est appliquée sur OPS PILOT V2 sous la version distante `20261103195531`. Le jeton interne de ce projet est une chaîne JSON ; le nouveau raccordement accepte cette représentation et l’objet historique `{token}` sans changer le jeton ni les autres workers. Le correctif SQL exact est conservé sous `20261103200052_customer_portal_worker_token_compatibility.sql`, version attribuée par le fournisseur ; le CLI Supabase n’est pas installé dans l’environnement de reprise.

La fonction `customer-portal-sync` est ACTIVE v2. Les huit tests Node ciblés passent. La recette SQL réelle passe en transaction annulée après les deux migrations : achat confirmé, refus des essais et impayés, déduplication, résiliation, contact ancré, ACL privées et reprise avec bail. Le contrôle HTTP réel via pg_net confirme 401 sans jeton, 403 avec Origin navigateur et 503 `sync_unavailable` avec le bon jeton lorsque la liaison reste désactivée. Zéro compte commercial et zéro événement subsistent après les fixtures.

Le portail TRADIKOM a été fusionné dans la PR 25 et la rubrique Mes services est visible sur le domaine public après rechargement. La recette d’activation décrite en tête de document confirme maintenant la réception réelle et l’envoi par le worker. Aucun achat de client réel n’a été utilisé pour cette recette. Aucun paiement, facture, invitation ou e-mail de client n’est émis par cette reprise. La connexion unique et le cycle d’achat TRADIKOM ONE restent à réaliser séparément.
