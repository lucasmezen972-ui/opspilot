# OpsPilot — Application de gestion des opérations terrain

OpsPilot est une application mobile professionnelle (inspirée de Yoobic) pour piloter les opérations magasin : audits, tâches, formation, communication interne et suivi de performance.

## TL;DR (format lisible pour IA)

- **Produit** : application mobile terrain pour retail, restauration et points de vente.
- **Stack** : Expo React Native + TypeScript + Expo Router + Supabase.
- **Valeur clé** : exécution opérationnelle + traçabilité + reporting.
- **Modules principaux** : Accueil, Audits, Produits, Tâches, Formation, Messages, Profil.

---

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
- Génération de rapports PDF.
- Gamification (badges, score, classement).
- Formation interactive (micro-cours + quiz).
- Filtres avancés (catégorie, date, magasin).

---

## 2) Architecture produit

### 2.1 Navigation par onglets
| Onglet | Rôle |
|---|---|
| Accueil | Dashboard + actions rapides |
| Audits | Contrôles qualité et suivi |
| Produits | Scanner + gestion catalogue/stock |
| Tâches | Exécution individuelle et équipe |
| Formation | Cours + quiz + progression |
| Messages | Communication temps réel |
| Profil | Stats personnelles + paramètres |

### 2.2 UX / design
- Interface moderne React Native.
- Charte cohérente orientée entreprise.
- Couleur principale : `#2563EB`.
- Animations et micro-interactions discrètes.
- Responsive sur différents formats d’écran.

---

## 3) Stack technique

| Domaine | Choix |
|---|---|
| Framework mobile | Expo React Native `53.0.0` |
| Navigation | Expo Router `5.0.2` |
| Langage | TypeScript |
| Icônes | Lucide React Native |
| Styling | StyleSheet React Native |
| État | React Hooks |
| Capture image | Expo Camera |
| Backend / DB | Supabase |

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
- Modèles personnalisés.
- Checklists interactives.
- Scoring automatique.
- Rapports PDF.
- Historique d’audits.

### Produits / stock
- Scan code-barres (simulation).
- Suivi de stock temps réel.
- Alertes ruptures et DLC.
- Fiches produits enrichies.

### Formation
- Parcours par compétences.
- Quiz de validation.
- Progression personnalisée.
- Récompenses liées à l’apprentissage.

---

## 6) Compte de démonstration

Pour les démos sans comptes réels, utiliser le compte de test dédié documenté dans [DEMO_USER_SETUP.md](./DEMO_USER_SETUP.md).

> Usage limité aux environnements de développement et de présentation.

---

## 7) Données d’exemple incluses

- Employés : Marie Dupont, Pierre Martin, Jean Leroy.
- Audits : rayon frais, sécurité, hygiène.
- Produits : références supermarché + codes-barres.
- Tâches : opérations courantes magasin.
- Formation : modules sectoriels.

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

**OpsPilot** — *Votre copilote pour des opérations terrain efficaces.*
