# Actions reconnaissables — OpsPilot, 3 novembre 2026

## Correction demandée

Lucas juge les accès de la PR 236 trop discrets : on doit distinguer immédiatement
une action, une information et une commande indisponible. Cette correction garde
la composition et la marque publiées ; la sobriété ne doit pas masquer les actions.

## Règles appliquées

- Action principale : bouton plein, texte explicite et retour à la pression.
- Action secondaire : contour bleu visible, fond distinct et zone délimitée.
- Accès à un écran : titre bleu, contour et flèche d’ouverture ; la ligne entière
  est la cible. Les accès terrain ont une vraie destination de lien sur le web,
  compatible avec le clic et Entrée. La flèche est décorative, sans seconde cible.
- Information : compteurs et statuts ne prennent pas le style des accès et ne
  deviennent pas cliquables. Les couleurs de criticité restent sémantiques.
- Indisponibilité : fond gris, bordure et texte lisibles, état désactivé exposé ;
  les boutons partagés ajoutent un cadenas. Le chargement conserve le libellé et
  affiche un indicateur d’attente. Aucun simple changement de curseur ne remplace
  la distinction visible sur téléphone.
- Survol et clavier : retour de survol sur ordinateur, contour de focus visible
  et activation adaptée au rôle. Les actions restent reconnaissables au repos.

Les lignes DLC, audits, raccourcis, outils et profil sont concernées, ainsi que
les boutons partagés, les onglets secondaires, la connexion et les commandes des
formulaires produit/tâche/audit. Ajouter un produit devient indisponible tant que
le nom obligatoire est vide ; la règle de validation métier existait déjà dans
la soumission, mais le bouton restait actif et ne donnait aucun résultat.
Le formulaire de création de tâche est borné à la hauteur disponible et son
contenu défile : en paysage, ses commandes dépassaient le bord de l’écran.

## Vérification

Les contrôles utilisent la démo locale ou des API interceptées et des comptes
fictifs. Ils ne créent aucune donnée serveur, n’envoient aucun message et ne
valident aucun paiement. La vérification web couvre les largeurs 320, 375, 768,
812, 1440 et 1920 pixels selon les écrans, le texte doublé, les destinations des
liens, le focus et les touches Entrée/Espace. Un formulaire incomplet est fermé
sans enregistrement après vérification de l’activation de sa commande.

TypeScript, ESLint, formatage, compilation et 376 tests unitaires passent. Les
99 scénarios Chromium distincts passent sur la compilation finale : 98 au passage
complet et le parcours paysage à la reprise, après un dépassement de cinq secondes
sur un écran de chargement. Les deux résultats sont conservés, sans augmenter le
délai ni masquer cet échec initial. Les sept contrôles propres aux commandes
passent également dans leur exécution ciblée.

Les captures avant/après et les résultats de la compilation finale sont réunis
dans `evidence/2026-11-03/action-affordances/validation.json`. Les captures avant
proviennent de la version publique e9e74e4 ; les captures après sont issues de
la compilation du candidat. Les limites restent celles du web : aucun audit natif
ni certification WCAG n’est revendiqué.

Les workflows manuels, dépendances, médias, Supabase, SEPA/Mollie/Qonto et
Cloudflare ne sont pas modifiés. Les identifiants exacts du candidat, de la
prévisualisation READY et de la production fusionnée sont consignés dans la PR.
