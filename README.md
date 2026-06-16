# OpsPilot — Application de gestion des opérations terrain

OpsPilot est une application mobile professionnelle (inspirée de Yoobic) pour piloter les opérations magasin : audits, tâches, formation, communication interne et suivi de performance.

## TL;DR (format lisible pour IA)

- **Produit** : application mobile terrain pour retail, restauration et points de vente.
- **Stack** : Expo React Native + TypeScript + Expo Router + Supabase.
- **Valeur clé** : exécution opérationnelle + traçabilité + reporting.
- **Modules principaux** : Accueil, Audits, Produits, Tâches, Formation, Messages, Profil.

---

> 👩‍💻 **Documentation développeur**
> — [Architecture](docs/ARCHITECTURE.md)
> · [Déploiement](docs/DEPLOYMENT.md)
> · [Supabase](docs/SUPABASE.md)
> · [Tests](docs/TESTING.md)
> · [Roadmap produit](docs/PRODUCT_ROADMAP.md)
> · [Conventions & pièges](docs/DEVELOPER.md)
> · [État du projet](docs/ETAT-PROJET.md)
> · [Audit technique](docs/TECHNICAL_AUDIT.md)

## 1) Fonctionnalités

### 1.1 Fonctionnalités cœur (inspirées de Yoobic)

- Création et gestion d'audits personnalisés.
- Checklists dynamiques pour les opérations terrain.
- Prise de photos justificatives dans les audits.
- Notifications automatiques (rappels/alertes).
- Chat interne d’équipe.
- Dashboard analytique de performance.

### 1.2 Différenciation OpsPilot (améliorations)

- Scanner de code-barres (ajout/vérification produits).
- Annotation des photos (flèches, texte, etc.).
- Mode hors-ligne avec synchronisation au retour réseau.
- Génération de rapports PDF (synthèse exécutive, détail par critère, plan d'action, bloc de signature).
- Plans d'action correctifs intelligents : l'échéance et les exigences de preuve sont déduites du problème détecté (chaîne du froid, hygiène, DLC, sécurité…).
- Gamification (badges, score, classement).
- Formation interactive (micro-cours + quiz anti-triche) avec attestations quasi-certifiantes nominatives.
- Filtres avancés (catégorie, date, magasin).

---

## 2) Architecture produit

### 2.1 Navigation par onglets

| Onglet    | Rôle                              |
| --------- | --------------------------------- |
| Accueil   | Dashboard + actions rapides       |
| Audits    | Contrôles qualité et suivi        |
| Produits  | Scanner + gestion catalogue/stock |
| Tâches    | Exécution individuelle et équipe  |
| Formation | Cours + quiz + progression        |
| Messages  | Communication temps réel          |
| Profil    | Stats personnelles + paramètres   |

### 2.2 UX / design

- Interface moderne React Native.
- Charte cohérente orientée entreprise.
- Couleur principale : `#2563EB`.
- Animations et micro-interactions discrètes.
- Responsive sur différents formats d’écran.

---

## 3) Stack technique

| Domaine          | Choix                      |
| ---------------- | -------------------------- |
| Framework mobile | Expo React Native `53.0.0` |
| Navigation       | Expo Router `5.0.2`        |
| Langage          | TypeScript                 |
| Icônes           | Lucide React Native        |
| Styling          | StyleSheet React Native    |
| État             | React Hooks                |
| Capture image    | Expo Camera                |
| Backend / DB     | Supabase                   |

---

## 4) Configuration Supabase

### Option A — automatique (recommandée)

1. Cliquer sur **“Connect to Supabase”** dans Bolt.
2. Bolt va automatiquement :
   - créer le projet Supabase,
   - configurer les variables d’environnement,
   - exécuter les migrations,
   - injecter les données d’exemple.

### Option B — manuelle

1. Créer un projet sur [supabase.com](https://supabase.com).
2. Copier l’URL et la clé anonyme.
3. Créer un fichier `.env` :

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Exécuter les migrations SQL dans l’éditeur Supabase.

---

## 5) Modules métier détaillés

### Gamification

- Niveaux d’expérience (XP).
- Badges/récompenses.
- Classements d’équipe.
- Suivi de performance individuel/collectif.

### Audits

- **Audits contextualisés par métier / zone** : chaque audit s'appuie sur un référentiel adapté à son contexte (HACCP, hygiène, sécurité incendie, chaîne du froid, réception, **parking / extérieur magasin**, etc.). Un audit extérieur ne contient que des critères extérieurs (propreté parking, chariots, déchets, places PMR, accès secours, éclairage, signalétique) — jamais de questions rayon, DLC ou froid.
- Audit libre neutre pour les contrôles ponctuels sans référentiel dédié (conformité, propreté, sécurité, anomalie, preuve), sans vocabulaire métier incohérent.
- Checklists interactives, critères pondérés, preuve photo.
- Scoring automatique et conformité par section.
- Génération automatique d'actions correctives sur non-conformité.
- Rapports PDF professionnels : synthèse exécutive, détail des critères, plan d'action correctif et double bloc de signature (auditeur / responsable).
- Historique d’audits.

### Actions correctives

- Génération d'un plan correctif structuré à partir du problème observé.
- Échéance dérivée de la criticité réelle : chaîne du froid `1 h`, hygiène critique / DLC `2 h`, sécurité immédiate, affichage prix `24 h`, etc.
- Exigences de preuve adaptées (photo, commentaire, identité du salarié, validation manager, escalade) selon le risque détecté.
- **Clôture contrôlée persistée et traçable** : les preuves (commentaire, nom et matricule de l'exécutant, preuve photo, validation manager, auteur et date de résolution) sont enregistrées sur l'action (Supabase hors démo, store local en démo) et résumées sur la carte. Le blocage est **métier, pas seulement UI** : une preuve manquante empêche la clôture, et une action exigeant une validation manager ne peut pas être clôturée seule par un employé (permission `action.validate`).

### Produits / stock

- Scan code-barres (simulation).
- Suivi de stock temps réel.
- Alertes ruptures et DLC.
- Fiches produits enrichies.

### Formation

- **Parcours quasi-certifiants longs et scénarisés** : chaque module prioritaire (HACCP, DLC/rotation, chaîne du froid, caisse, accueil client, management de proximité) compte au moins 6 chapitres concrets (procédures pas-à-pas, erreurs fréquentes, mini-situations terrain, points de contrôle manager, checklist opérationnelle, résumé final) pour une durée affichée crédible de 45 à 90 minutes.
- Quiz renforcés : 8 à 14 questions par module, dont au moins 2 cas pratiques (mises en situation) et des questions critiques.
- Quiz anti-triche : mélange des questions et des options, questions critiques, seuil de réussite, traçabilité des réponses (version d'évaluation, tentative, date).
- Attestation quasi-certifiante : le candidat confirme son identité (nom, matricule, poste, magasin) et signe sur l'honneur ; le certificat porte score, statut validé/échoué, durée, version et numéro unique.
- Supervision : le responsable suit nom, matricule, formation, score, date et statut de l'attestation, avec export CSV.
- Progression personnalisée et récompenses liées à l’apprentissage.

### Back-office superadmin

- Pilotage multi-organisations : liste des clients avec statut (active / démo / suspendue), plan, secteur, nombre d'utilisateurs, magasins, audits, actions ouvertes/critiques, formations terminées et dernière activité.
- Détail d'une organisation : résumé opérationnel, magasins rattachés, utilisateurs/rôles, modules actifs, abonnement, derniers audits et actions, alertes superadmin et état de configuration.
- Alertes priorisées (comptes suspendus, actions critiques, clients inactifs) et action « Contacter le support » (aucun bouton mort).
- Accessible aux rôles habilités (`backoffice.access`) et pleinement peuplé en mode démo.

### Onboarding client

- Parcours guidé : création de l'organisation, choix du secteur (supermarché, supérette, franchise, magasin spécialisé, restauration), activation des modules cohérents avec le secteur, premier magasin et premier manager.
- Écran final « configuration opérationnelle » et score de complétude, avec une base de départ adaptée au secteur.

---

## 6) Compte de démonstration

Pour les démos sans comptes réels, utiliser le compte de test dédié documenté dans [DEMO_USER_SETUP.md](./DEMO_USER_SETUP.md).

> Usage limité aux environnements de développement et de présentation.

---

## 7) Données d’exemple incluses

La démo est conçue comme une **histoire client cohérente, prête pour une présentation commerciale** (supermarchés, franchises) : un magasin avec des audits contextualisés, des actions correctives issues de vraies non-conformités, des formations longues et crédibles, des attestations sérieuses et des rapports PDF exploitables par un manager. Elle fonctionne entièrement hors-ligne, sans dépendre d'un Supabase réel.

- Employés : Marie Dupont (manager) et son équipe.
- Audits : contrôle hygiène rayon frais, chambre froide, DLC boulangerie, **audit HACCP professionnel structuré**, sécurité incendie, **tournée parking / extérieur** et contrôle terrain libre.
- Produits : références supermarché + codes-barres.
- Tâches : opérations courantes magasin.
- Formation : 6 parcours quasi-certifiants scénarisés (HACCP, DLC/rotation, chaîne du froid, accueil client, caisse, management).

---

## 8) Évolutions futures

- Intégrations API temps réel.
- Mode hors-ligne complet (audits/tâches/photos).
- Push notifications natives.
- Export avancé (Excel, CSV).
- Annotations caméra enrichies.
- Géolocalisation multi-sites.
- Dashboard manager renforcé.

---

## 9) Cas d’usage

### Supermarché / grande distribution

- Contrôles qualité rayon.
- Vérification DLC/stock.
- Formation personnel caisse.
- Coordination d’équipe.

### Retail / points de vente

- Audits merchandising.
- Contrôles sécurité.
- Formation produit.
- Pilotage des performances.

### Restauration

- Contrôles hygiène HACCP.
- Gestion stock.
- Formation sécurité alimentaire.
- Communication brigade.

---

## 10) Identité de marque

**Nom : OpsPilot** — évoque pilotage opérationnel, précision et efficacité terrain.

Palette principale :

- Primary Blue `#2563EB`
- Success Green `#10B981`
- Warning Orange `#F59E0B`
- Error Red `#EF4444`
- Neutral Gray `#6B7280`

---

**OpsPilot** — _Votre copilote pour des opérations terrain efficaces._
