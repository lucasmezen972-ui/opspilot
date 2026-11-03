# Facturation OpsPilot avec Qonto et Mollie

Décision de Lucas Mezen : factures dans Qonto, traitement des cartes par Mollie. Les coordonnées de reversement restent celles du compte Mollie relié à Qonto ; aucune modification bancaire ni aucun transfert n’est effectué par OpsPilot.

## Parcours client

1. L’administrateur client demande une facture depuis **Abonnement**. Le serveur rattache la demande à son organisation et la déduplique.
2. Le superadmin crée la facture dans Qonto : référence, montant TTC exact, taxes ou mention d’exonération et période de service. OpsPilot ne déduit jamais la TVA du prix affiché d’une offre.
3. Dans **Facturation clients Qonto**, le superadmin renseigne la référence, le total TTC et la fin de période, puis choisit **Créer le lien de règlement de cette facture**. Le serveur réserve une tentative et crée un paiement Mollie ponctuel, avec une clé d’idempotence stable. La création est bloquée tant que Mollie ne confirme pas la réception des paiements **et** l’autorisation des reversements.
4. Le client ouvre le lien depuis son abonnement et saisit sa carte chez Mollie. OpsPilot ne reçoit ni numéro de carte ni CVC.
5. Mollie notifie `mollie-webhook`. Le serveur relit le paiement avec sa propre clé, vérifie le montant en EUR, le mode, le profil, l’organisation, le plan, la référence et la tentative, puis applique la période payée. Le retour du navigateur n’active jamais un abonnement.
6. Le client peut utiliser **Actualiser mon règlement** pour relire son abonnement. Le superadmin dispose aussi de **Revérifier ce paiement auprès de Mollie** si une notification doit être reprise.

La facture légale reste dans Qonto. Le rapprochement de cette facture avec les reversements bancaires Qonto reste à effectuer : cette intégration ne crée ni facture Qonto par API ni rapprochement comptable Qonto automatique.

Le parcours manuel reste disponible pour les virements et les liens `https://pay.qonto.com/...` : rattacher le lien et sa référence, puis confirmer uniquement un règlement réellement reçu. Une facture déjà liée à un paiement Mollie ne peut pas être confirmée par les RPC manuelles Qonto. Ne pas créer deux liens de règlement pour la même facture.

## Périodes et contrôles

Chaque paiement couvre la période indiquée sur la facture. Aucun mandat ni prélèvement automatique n’est créé ; un nouveau règlement est requis pour chaque période suivante. Les liens récurrents Qonto peuvent être utilisés séparément si le compte est éligible et si le client les accepte, mais ne sont pas présentés comme intégrés à cette API.

Les tentatives sont privées et les opérations financières sont réservées au serveur. Les clients ne peuvent ni écrire un montant, ni transmettre un statut payé, ni appeler les RPC de confirmation Mollie. Seul le superadmin peut préparer un paiement avec une vraie session.

Une facture et sa tentative sont verrouillées dans le même ordre. Les doublons de facture et les notifications répétées n’ajoutent pas deux périodes. Une tentative de création ambiguë datant de plus de 50 minutes nécessite une vérification dans Mollie, car son cache d’idempotence expire après une heure. Les remboursements ou contestations détectés sont signalés pour examen ; un abonnement correspondant à ce paiement passe en retard de paiement. OpsPilot ne rembourse ni ne transfère de fonds par API.

## Secrets serveur

Les clés sont chiffrées dans Supabase Vault. Elles ne sont jamais placées dans GitHub, les variables `EXPO_PUBLIC_*`, le navigateur ou les réponses des fonctions. Les rôles `anon` et `authenticated` ne peuvent pas lire le coffre ni la configuration privée.

- `opspilot_mollie_live_v1` : accès de production limité au profil de paiement de l’éditeur ; création et lecture des paiements. Les permissions de lecture de profil et d’intégration, également sélectionnées, ne donnent pas accès aux ressources d’organisation avec cette restriction.
- `opspilot_mollie_test_v1` : paiements en mode test uniquement, sur le même profil.
- `opspilot_mollie_status_v1` : `onboarding.read` uniquement, utilisé séparément parce que Mollie impose un accès sans restriction de profil pour cet état d’organisation.
- `platform_settings.mollie_billing` contient le profil attendu, l’URL publique et l’activation du raccordement, sans valeur de clé.
- `get_mollie_billing_config` est exécutable par `service_role` uniquement. La clé remplacée a été révoquée ; les fichiers temporaires de transfert ont été effacés.

## État vérifié le 3 novembre 2026

- Le Dashboard Mollie annonce une fin de contrôle d’ici le **5 novembre 2026**, estimation sans garantie d’activation.
- L’API répond HTTP 200 et indique `status=in-review`, `canReceivePayments=true`, `canReceiveSettlements=false`. La création de paiements réels reste donc bloquée dans OpsPilot jusqu’à autorisation des reversements.
- Migrations appliquées : `20261103044345_mollie_verified_billing.sql` et `20261103044511_mollie_invoice_integrity.sql`. La migration Qonto antérieure porte la version en base `20261103034806` (fichier historique `20261103023738_qonto_billing_requests.sql`).
- Fonctions `mollie-billing` et `mollie-webhook` déployées. La première vérifie la session et le rôle côté serveur ; la seconde utilise la relecture authentifiée du paiement, conformément au protocole classique Mollie.
- **330 tests unitaires**, typecheck, lint, formatage et compilation web réussis. `supabase/tests/mollie_billing.sql` est passé en transaction annulée : isolation, montant et métadonnées falsifiés, déduplication, événements désordonnés et séparation test/production.
- Test carte Mollie de **1 € simulé** : création par l’API de test, page de carte fictive officielle, statut payé reçu par le webhook réel et tentative enregistrée comme payée en base. Aucun abonnement réel activé. La demande technique est annulée et son historique reste identifié en mode test.
- Contrôles HTTP : authentification absente 401, méthode incorrecte 405, notification invalide 400, corps excessif 413 ; un identifiant inconnu avec un faux statut payé n’a aucun effet.
- Aucun client réel facturé, aucun débit réel, mandat, remboursement ou transfert exécuté pendant cette intervention.
- Les anciens checkouts/portails Stripe renvoient 410 ; le cron Stripe reste désactivé. Les workflows GitHub Actions restent manuels.

## Sources officielles

- [Authentification et rotation des clés](https://docs.mollie.com/reference/authentication)
- [Permissions](https://docs.mollie.com/docs/permissions)
- [Création d’un paiement](https://docs.mollie.com/reference/create-payment)
- [Notifications et relecture du statut](https://docs.mollie.com/reference/webhooks)
- [Idempotence](https://docs.mollie.com/reference/api-idempotency)
- [Environnement de test](https://docs.mollie.com/reference/testing)
- [Fonctionnement des paiements Qonto/Mollie](https://support-fr.qonto.com/hc/fr/articles/32614584737425-Comment-fonctionnent-les-liens-de-paiement-pour-les-factures-avec-Qonto)

Une clé Mollie n’accorde pas un accès aux API Qonto. Toute future automatisation des factures ou du rapprochement Qonto doit utiliser ses accès et autorisations propres.
