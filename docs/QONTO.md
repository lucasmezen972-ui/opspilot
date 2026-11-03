# Facturation OpsPilot avec Qonto

Décision de Lucas Mezen du 2 novembre 2026 : les nouveaux règlements passent par Qonto.

## Parcours

1. L'administrateur du client demande une facture depuis **Abonnement**. La demande est rattachée à son organisation côté serveur et dédupliquée.
2. Le superadmin prépare la facture dans son vrai compte Qonto, puis rattache son lien `https://pay.qonto.com/...` et sa référence dans **Facturation clients Qonto**.
3. Le client règle sur la page Qonto. Aucun identifiant de carte n'est traité par OpsPilot.
4. Après vérification de l'encaissement dans Qonto, le superadmin confirme la référence et la fin de la période réglée. Le serveur active le bon plan et journalise l'opération.

Une demande, un clic ou une redirection ne valent jamais paiement. Le rapprochement est manuel : il n'y a pas de webhook Qonto opérationnel ni de prélèvement automatique configuré dans OpsPilot à cette étape.

Pour les échéances suivantes, utiliser les factures récurrentes Qonto ou les liens récurrents éligibles dans le compte, puis rapprocher chaque période effectivement réglée. Ne pas présenter un lien réutilisable ponctuel comme un abonnement automatique.

## Déploiement requis

- Migration `20261103023738_qonto_billing_requests.sql` : préparation du schéma et des RPC sécurisées. La tentative MCP du 2 novembre a expiré à l'étape de confirmation ; vérifier `to_regclass('public.billing_requests')` avant d'annoncer sa mise en service.
- Authentification au compte Qonto de l'éditeur, activation de l'encaissement si nécessaire et création d'une première facture réelle après accord commercial.
- Les anciens endpoints de création de checkout et de portail Stripe renvoient HTTP 410. Le cron `stripe-sync-worker` est désactivé ; les données historiques et le webhook sont conservés.
- Aucun débit, mandat, abonnement ou message client n'a été créé pendant cette intervention.

## Sources officielles consultées

- [Liens récurrents](https://support-fr.qonto.com/hc/fr/articles/43017462111505-Comment-cr%C3%A9er-et-g%C3%A9rer-des-liens-de-paiement-r%C3%A9currents)
- [Factures récurrentes](https://support-fr.qonto.com/hc/fr/articles/44040118613777-Comment-cr%C3%A9er-et-g%C3%A9rer-des-factures-r%C3%A9currentes)
- [API et suivi des paiements](https://docs.qonto.com/guides/payments/payment-links)

Les fonctions de création de liens de l'API ne doivent pas être supposées disponibles avec une simple clé bancaire : vérifier les scopes OAuth et l'éligibilité du compte avant toute automatisation.
