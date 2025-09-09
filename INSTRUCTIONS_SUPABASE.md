## 🚀 CONFIGURATION SUPABASE RAPIDE

### **PROBLÈME : "Click to connect to Supabase"**
L'app affiche ce message car Supabase n'est pas encore configuré.

---

### **SOLUTION EXPRESS (2 MINUTES) :**

#### **1. Cliquez sur "Connect to Supabase"** 
- **En haut à droite** de l'interface Bolt
- Bolt va automatiquement tout configurer

#### **2. OU Configuration manuelle :**

**A. Créer le projet Supabase :**
1. Allez sur [supabase.com](https://supabase.com)
2. **"New Project"** 
3. Notez **URL** et **anon key** (Settings > API)

**B. Configurer les variables :**
- **Cliquez** sur le fichier `.env` 
- **Remplacez** les placeholders par vos vraies valeurs :
```env
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs... (votre vraie clé)
```

**C. Créer la base de données :**
1. **Supabase** → **SQL Editor** → **"New query"**
2. **Copiez** tout le fichier `create_complete_opspilot_schema.sql`
3. **Collez** et cliquez **"RUN"** 
4. **Attendez** 10-15 secondes

**D. Créer l'utilisateur démo :**
1. **Copiez** le fichier `create_demo_user_final.sql`
2. **Collez** dans SQL Editor et **"RUN"**
3. **Ou** : Authentication → Users → Add user → Create new user
   - Email: `demo@opspilot.com` 
   - Password: `demo123`

---

### ✅ **VÉRIFICATION FINALE :**
1. **Rafraîchissez** l'app (F5)
2. **Connectez-vous** : `demo@opspilot.com` / `demo123`
3. **Vérifiez** que tous les onglets marchent

---

### 🎯 **RÉSULTAT ATTENDU :**
- ✅ **Plus de message** "Connect to Supabase"
- ✅ **Connexion réussie** avec Marie Dupont
- ✅ **Dashboard** avec vraies statistiques
- ✅ **Toutes fonctionnalités** opérationnelles

---

## 🆘 **EN CAS DE PROBLÈME :**

**"Invalid login credentials"** → L'utilisateur demo n'existe pas → Exécutez `create_demo_user_final.sql`

**"Network request failed"** → Problème de configuration → Vérifiez URL/clé dans `.env`

**App qui reste bloquée** → Rafraîchissez (F5) ou redémarrez le dev server

**Autres erreurs** → Envoyez-moi le message exact pour un fix immédiat !