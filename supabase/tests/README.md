# Vérifications SQL

Les fichiers `*_integrity.sql` et `billing_plan_mapping.sql` utilisent le schéma
minimal `fixtures/schema.sql` et des identités `example.invalid`. Ils testent les
invariants sans ouvrir de connexion vers Supabase, Mollie ou Qonto. Le lecteur
MP4 de six secondes dans `e2e/fixtures` est un fichier technique, sans cours.

```bash
npm install --prefix /tmp/opspilot-sql-runtime --ignore-scripts --no-audit @electric-sql/pglite@0.3.14
OPSPILOT_PGLITE_PATH=/tmp/opspilot-sql-runtime/node_modules/@electric-sql/pglite/dist/index.js node supabase/tests/run-local.mjs
```

Le lanceur applique les migrations, rejoue les quatre nouvelles migrations pour
vérifier leur idempotence, puis exécute les scénarios dans des transactions annulées.
La fixture reproduit les colonnes et contrôles utiles au projet ; elle ne remplace
pas un contrôle du schéma et des politiques du projet Supabase déployé.

`tenant_access.sql`, `employee_access.sql` et `training_integrity.sql` peuvent être
exécutés par le rôle de maintenance sur le projet de référence, dans leurs
transactions `ROLLBACK`. Le test de formation choisit deux profils actifs de
deux organisations différentes et n’en conserve aucune modification.

Les autres fixtures ne doivent pas être exécutées sur les données d’un client.
`mollie_billing.sql` peut faire l’objet de contrôles de maintenance encadrés,
mais cette reprise l’exécute uniquement localement avec les identités fictives.

Les tests navigateur `billingFixture.ts`, `15-sepa-ui` et `16-connected-video`
interceptent les requêtes des comptes fictifs : ils valident les interfaces et
les appels attendus, sans prouver un règlement chez un prestataire. Les tests
Deno `_shared/sepa_test.ts` contrôlent le SDK, les associations et les calendriers :

```bash
deno test --allow-env --node-modules-dir=auto supabase/functions/_shared/sepa_test.ts
```

La lecture des variables est nécessaire au SDK officiel ; les appels réseau du
test sont interceptés et aucune clé réelle n’est employée. Aucun débit ou facture
de client réel ne doit servir de test d’intégration.
