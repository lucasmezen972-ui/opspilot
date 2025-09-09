# OpsPilot - Application de Gestion des Opérations Terrain

OpsPilot est une application mobile professionnelle inspirée de Yoobic, spécialisée dans la gestion des opérations terrain, les audits en magasin, le suivi des tâches, la formation du personnel et la communication interne.

## 🎯 Fonctionnalités Principales

### ✅ Fonctionnalités de base (inspirées de Yoobic)
- **Création et gestion d'audits personnalisés** - Interface intuitive pour créer et suivre les audits
- **Checklists dynamiques** - Listes de contrôle pour les opérations terrain
- **Prise de photos justificatives** - Système de capture d'images intégré aux audits
- **Notifications automatiques** - Rappels et alertes pour les tâches à venir
- **Module de communication interne** - Chat d'équipe simplifié
- **Dashboard analytique** - Suivi des performances et statistiques

### ✨ Améliorations par rapport à Yoobic
- **📱 Scanner de code-barres** - Ajout/vérification rapide des produits lors des contrôles
- **🖍️ Annotation des photos** - Possibilité d'annoter directement les photos (flèches, texte, etc.)
- **📶 Mode hors-ligne** - Synchronisation automatique dès le retour de la connexion
- **📄 Génération de rapports PDF** - Rapports d'audit automatiques avec en-tête personnalisé
- **🎮 Gamification intégrée** - Système de badges, classements et scoring des employés
- **📚 Formation interactive** - Espace formation avec micro-cours et quiz
- **🔍 Filtres avancés** - Recherche facilitée par catégorie, date ou magasin

## 📱 Architecture de l'application

### Navigation par onglets
- **Accueil** - Dashboard principal avec statistiques et actions rapides
- **Audits** - Gestion des audits et contrôles qualité
- **Produits** - Scanner et gestion des produits
- **Tâches** - Suivi des tâches individuelles et d'équipe
- **Formation** - Modules de formation et quiz interactifs
- **Messages** - Communication d'équipe en temps réel
- **Profil** - Statistiques personnelles et paramètres

### Design et UX
- Interface moderne et fluide avec React Native
- Design professionnel inspiré des applications d'entreprise
- Système de couleurs cohérent (bleu principal #2563EB)
- Micro-interactions et animations subtiles
- Responsive design adapté à tous les écrans

## 🛠 Technologies Utilisées

- **Framework** : Expo React Native 53.0.0
- **Navigation** : Expo Router 5.0.2 avec navigation par onglets
- **Langage** : TypeScript
- **Icons** : Lucide React Native
- **Styling** : StyleSheet React Native
- **État** : React Hooks
- **Images** : Expo Camera pour la capture

## 🎨 Identité Visuelle

### Nom : OpsPilot
Un nom professionnel qui évoque :
- Le **pilotage** d'opérations
- La **précision** et l'efficacité
- Le **terrain** et les opérations

### Couleurs principales
- **Primary Blue** : #2563EB (actions principales)
- **Success Green** : #10B981 (validations, succès)
- **Warning Orange** : #F59E0B (alertes, stock faible)
- **Error Red** : #EF4444 (erreurs, ruptures)
- **Neutral Gray** : #6B7280 (textes secondaires)

## 🚀 Fonctionnalités Détaillées

## ⚙️ Configuration Supabase

### Configuration automatique (Recommandé)
1. **Cliquez sur "Connect to Supabase"** dans le coin supérieur droit de Bolt
2. Bolt va automatiquement :
   - Créer un projet Supabase
   - Configurer les variables d'environnement
   - Exécuter les migrations de base de données
   - Insérer les données d'exemple

### Configuration manuelle
Si vous préférez configurer manuellement :
1. Créez un projet sur [supabase.com](https://supabase.com)
2. Copiez l'URL et la clé anonyme
3. Créez un fichier `.env` :
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
4. Exécutez les migrations SQL dans l'éditeur Supabase

### Système de Gamification
- **Niveaux d'expérience** avec points XP
- **Badges et récompenses** pour motiver les employés
- **Classements d'équipe** pour encourager la compétition saine
- **Suivi des performances** individuel et collectif

### Gestion des Audits
- **Création d'audits personnalisés** selon les besoins
- **Checklists interactives** avec validation étape par étape
- **Système de scoring** automatique
- **Génération de rapports PDF** professionnels
- **Suivi historique** des audits précédents

### Scanner et Gestion Produits
- **Scanner de codes-barres** intégré (simulation)
- **Gestion des stocks** en temps réel
- **Alertes automatiques** pour les ruptures et DLC
- **Fiches produits complètes** avec photos et détails

### Formation Interactive
- **Modules de formation** par compétences
- **Quiz interactifs** pour valider les acquis
- **Suivi de progression** personnalisé
- **Système de récompenses** lié à la formation

## 📊 Données d'Example

L'application contient des données de démonstration réalistes :
- Profils d'employés (Marie Dupont, Pierre Martin, Jean Leroy)
- Audits types (rayon frais, sécurité, hygiène)
- Produits de supermarché avec codes-barres
- Tâches opérationnelles courantes
- Formations sectorielles

## 🔄 Évolutions Futures

- **Intégration API** pour données temps réel
- **Mode hors-ligne complet** avec SQLite
- **Push notifications** natives
- **Export avancé** (Excel, CSV)
- **Intégration caméra** pour annotations
- **Géolocalisation** pour audits multi-sites
- **Dashboard manager** pour supervision

## 💼 Cas d'Usage

### Supermarché / Grande Distribution
- Contrôles qualité rayons
- Vérification DLC et stock
- Formation personnel caisse
- Communication équipes

### Retail / Points de Vente
- Audits merchandising
- Contrôles sécurité
- Formation produits
- Suivi performances

### Restauration
- Contrôles hygiène HACCP
- Gestion des stocks
- Formation sécurité alimentaire
- Communication brigade

---

**OpsPilot** - *Votre copilote pour des opérations terrain efficaces* 🎯