# Accessibilité et parcours web — 3 novembre 2026

## Obstacles constatés

La reprise part de la PR 237 déjà publiée, commit
`2adc97f8428817370d65fb710252548c3c2e5e50`. La vérification navigateur
confirme que la création de tâche ne ferme pas avec Échap, que ses champs
reposent seulement sur les placeholders, et que priorité/récurrence n’exposent
pas de groupe à choix unique. Dans les onglets secondaires, Flèche droite ne
déplace pas le focus et Espace n’active pas la vue. Le titre du document est vide.
Le parcours Tous les outils → Produits remplace l’entrée d’historique : Retour
ramène à l’accueil, au lieu de revenir au hub. Le formulaire d’audit n’a ni nom
de dialogue ni commande de fermeture nommée dans sa version antérieure.

## Corrections

- Les créations de tâche et d’audit réutilisent la fenêtre partagée, bornée et
  défilable : nom de dialogue associé au titre visible, fermeture nommée,
  Échap, focus contenu dans la fenêtre et retour au déclencheur après fermeture.
  Un complément web préserve le déclencheur : le piège de focus de RN Web pouvait
  mémoriser le champ auto-focalisé à sa place.
- Les champs gardent leurs labels après saisie ; l’obligation du titre est
  visible et exposée. Le texte précise le prérequis avant l’action Créer.
- Priorité et récurrence sont des groupes nommés à choix unique. La sélection a
  un état accessible, un cercle/coché visible et sa couleur existante. Flèches,
  Début/Fin, Espace/Entrée fonctionnent ; Tabulation sort du groupe sans traverser
  chaque option. Les cibles font au moins 44 px de haut.
- Les onglets secondaires du cockpit, de la communication et de la formation
  suivent le même parcours clavier : flèches pour parcourir, Espace/Entrée pour
  activer, Tabulation pour rejoindre le panneau nommé. Un seul onglet est dans
  la séquence de tabulation. La formation ne reçoit qu’un conteneur et des
  relations accessibles : aucun cours, média, quiz ou accès serveur ne change.
- L’espace de travail affiche un titre de document propre à chaque écran et
  garde l’historique complet sur le web. Retour/Avancer retrouvent les étapes,
  y compris quand un écran est revisité. Le comportement natif est conservé.
- La revue du texte doublé a fait apparaître un chevauchement des choix de
  récurrence. Leur largeur minimale dépend maintenant du libellé réel sur le web ;
  ils passent à la ligne au lieu de se superposer.

## Vérifications et limites

Les résultats finaux, empreintes et captures sont réunis dans
`evidence/2026-11-03/accessibility-journeys/validation.json`. La PR conserve les
SHA exacts, la preview READY, l’arbre fusionné et le contrôle du domaine public.
Les tests couvrent le clavier et les noms/états accessibles, les formulaires
vides/remplis, l’annulation et la restauration du focus, les panneaux d’onglet,
le retour navigateur, le texte à 200 % et le reflow à 320/375/812 px. Les écrans
partagés sont aussi revus aux autres formats de la régression existante.

Les données viennent de la démo locale ou de requêtes fictives interceptées.
Aucune écriture de production, invitation, envoi métier ou paiement ; aucun
changement Supabase, bancaire, Cloudflare, dépendance ou workflow. Les médias
restent inchangés. Les captures sont inspectées après les animations.

Ces contrôles du web ne constituent ni un audit complet WCAG, ni une validation
par lecteur d’écran ou sur appareil natif. Les autres formulaires et composants
ne sont pas déclarés intégralement accessibles par cette passe.

Références primaires : [WAI, dialogues modaux](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/),
[WAI, onglets](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/),
[React Navigation, historique sur le web](https://reactnavigation.org/docs/web-support/).
L’option `fullHistory` et le comportement du piège de focus ont été contrôlés
dans les versions effectivement installées, sans mise à jour de dépendance.

## Revue publique complémentaire — filtres de supervision

La revue des captures publiques de la PR 238 a révélé des filtres étirés :
environ 290 px à 375 px et 334 px sur ordinateur lors de la reproduction locale.
Le parcours clavier passait mais cette présentation n’était pas satisfaisante.
Le ScrollView horizontal ne grandit plus dans l’espace restant ; ses choix sont
centrés et gardent une cible d’au moins 44 px. La liste des salariés retrouve
l’espace utile. Aucun contenu, média, droit ou envoi de relance n’est modifié.

Deux contrôles reproduisent le défaut de hauteur avant correction ; trois autres
vérifient la barre mobile après focus des panneaux. Les cinq passent après
correction. La compilation corrigée passe 22 scénarios ciblés : création et
fermeture des formulaires, clavier, historique, texte doublé, rôle salarié,
formation et panneaux. TypeScript, ESLint et formatage passent. Les 110 scénarios
de la PR 238 restent la preuve de la passe précédente ; ils ne sont pas présentés
comme une nouvelle exécution complète de ce correctif de cinq lignes de style.

Captures avant/après et résultats : `evidence/2026-11-03/accessibility-panels/`.
Le SHA exact du correctif, sa preview READY et la production revérifiée sont
consignés dans la PR de suivi.
