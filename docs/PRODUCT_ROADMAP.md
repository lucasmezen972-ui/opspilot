# Roadmap produit OpsPilot

Cap : plateforme **SaaS B2B enterprise** de conformité terrain pour la
grande distribution, le retail multi-sites, la restauration et les
franchises. Montée en gamme **progressive** (pas de refonte brutale), socle
toujours vert.

## Lot 0 — Socle propre & premium (en cours)

- 0.1 Audit technique (`docs/TECHNICAL_AUDIT.md`). ✅
- 0.2 Nettoyage des logs de débogage. ✅
- 0.3 Design system : `tokens.ts` + composants `App*`, appliqués au fil des
  écrans (dashboard, produits, actions…). 🔄
- 0.4 Debug global : erreurs Supabase traduites, états d'erreur/chargement
  homogènes, error boundary. 🔄
- 0.5 Durcissement des tests (testID, assertions strictes).
- 0.6 Documentation (ce dossier).
- Wording premium (« Plan d'action correctif », « Preuve photo »,
  « Évaluation »…), traité avec mise à jour conjointe des specs E2E.

## Lot 1 — Conformité terrain enterprise

Audits de conformité avancés (sections, items typés, criticité, photo/
commentaire obligatoires, verrouillage après clôture) ; plans d'action
correctifs cadrés (matrice de délais selon criticité, validation manager) ;
**PDF d'audit professionnels** ; tâches traçables (nom/matricule/preuve) et
récurrentes ; scan code-barres fiable tous navigateurs.

## Lot 2 — Formation, évaluation, communication, IA

Formations quasi-certifiantes (modules, chapitres, attestation) ; quiz
**anti-triche** (banque de questions, mélange, questions critiques
éliminatoires) ; supervision formation ; messagerie interne officielle
(canaux, accusés de lecture) ; IA métier **cadrée** sur sources validées
(base de connaissances, garde-fous).

## Lot 3 — Enterprise, gouvernance, scalabilité

Cockpit manager ; back-office superadmin enrichi ; gouvernance
(versionnage, verrouillage, journaux, preuves) ; reporting direction
multi-sites (PDF/CSV/Excel) ; matrice de permissions par rôle ; multi-tenant
strict, index, pagination, monitoring.

> Détail complet des lots : voir le brief produit interne. L'état réel
> d'avancement vit dans `docs/ETAT-PROJET.md`.
