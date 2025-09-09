# 🚀 GUIDE DE CONFIGURATION SUPABASE - OPSPILOT

## ⚡ CONFIGURATION EXPRESS (5 MINUTES)

### **ÉTAPE 1 : Créer le projet Supabase**
1. Allez sur [supabase.com](https://supabase.com)
2. **Créez un nouveau projet** ou ouvrez le projet existant
3. Notez l'**URL** et la **clé anonyme** (Settings → API)

### **ÉTAPE 2 : Configurer les variables d'environnement**
Dans Bolt, créez un fichier `.env` avec :
```env
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anonyme
OPENAI_API_KEY=sk-proj-votre-cle-openai
```

### **ÉTAPE 3 : Exécuter le script de création**
1. **Ouvrez** Supabase → **SQL Editor**
2. **Copiez** tout le contenu de `supabase/migrations/create_complete_opspilot_schema.sql`
3. **Collez** et cliquez **"RUN"**
4. **Attendez** 10-15 secondes pour l'exécution complète

### **ÉTAPE 4 : Créer l'utilisateur de démonstration**
1. **Supabase** → **Authentication** → **Users**
2. **"Add user"** → **"Create new user"**
3. **Email:** `demo@opspilot.com`
4. **Password:** `demo123`
5. **Confirmez** automatiquement l'email ✅

### **ÉTAPE 5 : Créer le profil utilisateur**
Dans **SQL Editor**, exécutez :
```sql
INSERT INTO profiles (
  id, 
  organization_id, 
  store_id, 
  email, 
  full_name, 
  role, 
  level, 
  xp, 
  total_audits, 
  avg_score, 
  completed_trainings, 
  active_time_hours
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'demo@opspilot.com' LIMIT 1),
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440001',
  'demo@opspilot.com',
  'Marie Dupont',
  'manager',
  4,
  850,
  47,
  92,
  12,
  156
);
```

---

## ✅ **VÉRIFICATION FINALE**

### Dans l'app OpsPilot :
1. **Rafraîchissez** l'application (F5)
2. **Connectez-vous** avec `demo@opspilot.com` / `demo123`
3. **Vérifiez** que tous les onglets fonctionnent
4. **Testez** la création d'audits et de tâches

### Vous devriez voir :
- ✅ **Dashboard** avec statistiques réelles
- ✅ **18 tables** fonctionnelles
- ✅ **Données de démonstration** cohérentes
- ✅ **Toutes les fonctionnalités** opérationnelles
- ✅ **IA activée** avec OpenAI

---

## 🎯 **BACKEND ENTERPRISE COMPLET !**

Votre plateforme OpsPilot dispose maintenant :
- 🏢 **Multi-tenant** sécurisé avec RLS
- 🧠 **IA intégrée** pour recommandations
- 📊 **Analytics avancés** avec insights
- 🛡️ **Sécurité enterprise** 
- 🚀 **Scalabilité** pour croissance

**En cas de problème, vérifiez que les variables d'environnement sont correctes !**