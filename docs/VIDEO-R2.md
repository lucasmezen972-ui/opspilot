# Vidéos privées avec Cloudflare R2

L'intégration est optionnelle. Les vidéos déjà stockées dans Supabase restent
privées et lisibles par le lecteur existant. Une absence de configuration R2
conserve l'import Supabase de 50 Mo ; elle ne promet pas d'espace supplémentaire.

## Parcours et contrôles

- Un responsable connecté importe un MP4 de 250 Mio maximum. L'app réserve
  atomiquement sa taille et un chemin lié à son organisation, sa formation,
  son chapitre et son identifiant de tentative.
- Le serveur signe un PUT de 15 minutes au maximum, avec taille et type MIME
  imposés. `If-None-Match: *` empêche un rejeu d'écraser un fichier existant.
  Aucun JWT OpsPilot ni secret R2 n'est envoyé dans les en-têtes de cet import.
- Avant publication, le serveur vérifie la taille, le type MIME et l'en-tête
  MP4 réel avec HEAD et une lecture partielle. Cela ne constitue ni une analyse
  antivirus ni une validation pédagogique du contenu.
- Le chapitre ne peut utiliser qu'un import marqué vérifié par le serveur,
  pour le même chapitre et la même organisation. Les tables de réservation et
  la configuration sont inaccessibles aux rôles clients.
- La lecture exige une session active, une organisation autorisée et un cours
  actif. Le serveur délivre un lien GET valable une heure. Ce lien est un accès
  temporaire : quiconque le possède peut lire le fichier jusqu'à son expiration.
- Une réponse perdue réutilise le même identifiant. Aucun fichier n'est effacé
  automatiquement. Une réservation abandonnée continue de compter dans le quota
  jusqu'à vérification manuelle de son objet puis nettoyage encadré.

## Limites de coût

La réserve applicative est plafonnée à **8 000 000 000 octets** pour tout le
bucket dédié, imports en attente compris, afin de garder une marge sous les
10 Go-mois gratuits de R2 Standard. Le quota gratuit Cloudflare est partagé
avec les autres usages du compte et comprend aussi des limites de requêtes.
Ce plafond applicatif n'est donc pas un plafond de facturation Cloudflare.
Les objets ajoutés hors OpsPilot ne sont pas comptés par cette réserve.

Ne pas activer R2 sur la promesse d'une gratuité illimitée. Vérifier le compte,
les conditions, les autres usages et les alertes de facturation avant activation.
Le téléchargement ne transite pas par Supabase ou Vercel : les octets vont
directement du bucket au lecteur. Aucun transcodage vidéo payant n'est activé.

## Configuration serveur à réaliser

1. Dans le compte Cloudflare choisi par Lucas, disposer du service R2 Standard
   et créer un **nouveau bucket vide dédié à OpsPilot**, de préférence en UE.
   Garder les accès publics et `r2.dev` désactivés. Ne pas migrer ni supprimer
   les vidéos Supabase existantes durant cette étape.
2. Créer un accès S3 limité à la lecture et l'écriture des objets de ce seul
   bucket. Conserver les valeurs exclusivement dans le coffre Supabase :
   secret `opspilot_training_r2_v1`, objet JSON contenant `accountId`, `bucket`,
   `accessKeyId`, `secretAccessKey`. Ne jamais copier cet objet renseigné dans
   Git, les rapports, Notion ou le navigateur de l'application.
3. Autoriser ce CORS sur le bucket, en adaptant seulement les origines réellement
   nécessaires ; ne pas utiliser d'origine générique pour la production :

   ```json
   [
     {
       "AllowedOrigins": ["https://opspilot-mu-six.vercel.app"],
       "AllowedMethods": ["GET", "HEAD", "PUT"],
       "AllowedHeaders": [
         "Content-Type",
         "Content-Length",
         "If-None-Match",
         "Range"
       ],
       "ExposeHeaders": ["ETag", "Content-Length", "Content-Range"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

4. Appliquer la migration `private_r2_training_media` et déployer la fonction
   `training-media` avec ses dépendances. Elle vérifie elle-même les sessions.
   Le paramètre de passerelle `verify_jwt=false` n'autorise aucun accès anonyme.
5. Après vérification des accès et du budget, activer uniquement le booléen
   `platform_settings.training_video_storage.r2_enabled`. Les secrets restent
   dans Vault. L'app ne montre 250 Mo que si la fonction confirme cette activation.
6. Tester avec une organisation fictive et un MP4 technique : import réel,
   refus du changement de taille/type, rejeu 412 puis reprise, validation,
   lecture mobile/ordinateur et refus depuis un autre compte. Vérifier les
   en-têtes CORS et la signature Content-Length avec le prestataire réel avant
   ouverture commerciale. Les tests interceptés ne prouvent pas ces points.

## Vérifications reproductibles

Le test SQL `r2_training_integrity.sql` s'exécute uniquement sur la fixture
locale via `supabase/tests/run-local.mjs`. Il couvre les réservations rejouées,
les accès, la publication après vérification, l'isolation et le quota global.
Les tests Deno `_shared/trainingR2_test.ts` utilisent des identifiants fictifs
et interceptent les appels du prestataire. Le scénario navigateur
`e2e/18-r2-video.spec.ts` couvre import, reprise après erreur et lecture à
375 et 1440 pixels, avec API entièrement interceptées.

Sources officielles :
[prix R2](https://developers.cloudflare.com/r2/pricing/),
[liens signés](https://developers.cloudflare.com/r2/api/s3/presigned-urls/),
[CORS](https://developers.cloudflare.com/r2/buckets/cors/),
[aws4fetch](https://developers.cloudflare.com/r2/examples/aws/aws4fetch/).
