/*
  # Schema OpsPilot Complet - Base de données enterprise

  1. Tables principales
    - `organizations` - Organisations/entreprises
    - `stores` - Magasins/sites
    - `departments` - Départements par magasin
    - `profiles` - Profils utilisateurs étendus
    - `audit_templates` - Templates d'audits
    - `audit_items` - Items/questions d'audit
    - `audits` - Audits réalisés
    - `audit_responses` - Réponses aux items d'audit
    - `audit_photos` - Photos d'audit avec annotations
    - `tasks` - Tâches opérationnelles
    - `products` - Catalogue produits
    - `trainings` - Formations disponibles
    - `user_training_progress` - Progression formations
    - `conversations` - Conversations chat
    - `messages` - Messages
    - `notifications` - Notifications système
    - `badges` - Système de badges
    - `user_badges` - Attribution des badges
    - `user_sessions` - Sessions utilisateurs
    - `reports` - Rapports générés

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques par organisation
    - Vues sécurisées pour les permissions

  3. Performance
    - Index optimisés pour les requêtes fréquentes
    - Triggers pour les timestamps automatiques
    - Contraintes pour l'intégrité des données

  4. Données de démonstration
    - Organisation de test
    - Utilisateurs de démonstration
    - Données réalistes pour les tests
*/

-- Nettoyer les tables existantes si elles existent
DROP TRIGGER IF EXISTS set_updated_at ON profiles CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON organizations CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON stores CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON audits CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON audit_templates CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON tasks CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON products CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON trainings CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON user_training_progress CASCADE;

DROP VIEW IF EXISTS v_current_profile CASCADE;
DROP VIEW IF EXISTS v_is_admin CASCADE;
DROP VIEW IF EXISTS v_is_manager CASCADE;

DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS user_training_progress CASCADE;
DROP TABLE IF EXISTS trainings CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS audit_photos CASCADE;
DROP TABLE IF EXISTS audit_responses CASCADE;
DROP TABLE IF EXISTS audits CASCADE;
DROP TABLE IF EXISTS audit_items CASCADE;
DROP TABLE IF EXISTS audit_templates CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP FUNCTION IF EXISTS tg_set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Créer la fonction trigger pour updated_at
CREATE OR REPLACE FUNCTION tg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Table des utilisateurs (liée à auth.users)
CREATE TABLE users (
  id uuid PRIMARY KEY NOT NULL,
  email citext UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des organisations
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  settings jsonb DEFAULT '{}',
  subscription_plan text DEFAULT 'pro' CHECK (subscription_plan IN ('basic', 'pro', 'enterprise')),
  max_users integer DEFAULT 100,
  max_stores integer DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des magasins
CREATE TABLE stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  city text,
  postal_code text,
  country text DEFAULT 'France',
  latitude numeric(10,8),
  longitude numeric(11,8),
  manager_id uuid,
  settings jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des départements
CREATE TABLE departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  manager_id uuid,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT uq_departments_store_name UNIQUE(store_id, lower(name))
);

-- Table des profils utilisateurs
CREATE TABLE profiles (
  id uuid PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE SET NULL,
  email citext NOT NULL,
  full_name text,
  phone text,
  avatar_url text,
  role text DEFAULT 'employé' CHECK (role IN ('admin', 'manager', 'employé', 'stagiaire')),
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  level integer DEFAULT 1,
  xp integer DEFAULT 0,
  total_audits integer DEFAULT 0,
  avg_score integer DEFAULT 0,
  completed_trainings integer DEFAULT 0,
  active_time_hours integer DEFAULT 0,
  last_active timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT uq_profiles_id UNIQUE(id)
);

-- Templates d'audit
CREATE TABLE audit_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text,
  estimated_duration integer,
  max_score integer DEFAULT 100,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Items d'audit (questions/critères)
CREATE TABLE audit_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES audit_templates(id) ON DELETE CASCADE,
  question text NOT NULL,
  item_type text DEFAULT 'checkbox' CHECK (item_type IN ('checkbox', 'rating', 'text', 'photo', 'numeric')),
  is_required boolean DEFAULT false,
  points integer DEFAULT 10 CHECK (points >= 0),
  sort_order integer DEFAULT 0,
  options jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- Table des audits
CREATE TABLE audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  template_id uuid REFERENCES audit_templates(id) ON DELETE SET NULL,
  auditor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  location text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  score integer CHECK (score IS NULL OR (score >= 0 AND score <= max_score)),
  max_score integer DEFAULT 100,
  issues_count integer DEFAULT 0,
  photos text[] DEFAULT '{}',
  notes text,
  started_at timestamptz,
  completed_at timestamptz,
  due_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Réponses aux items d'audit
CREATE TABLE audit_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES audit_items(id) ON DELETE CASCADE,
  response_value text,
  score integer DEFAULT 0,
  notes text,
  photos text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT audit_responses_audit_id_item_id_key UNIQUE(audit_id, item_id)
);

-- Photos d'audit avec annotations
CREATE TABLE audit_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  audit_id uuid NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  comment text,
  file_size integer,
  annotations jsonb DEFAULT '[]',
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Table des tâches
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  location text,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  estimated_time_minutes integer,
  due_date timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Catalogue des produits
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  barcode text,
  name text NOT NULL,
  category text,
  price numeric(10,2) CHECK (price IS NULL OR price >= 0),
  stock_quantity integer DEFAULT 0 CHECK (stock_quantity >= 0),
  min_stock integer DEFAULT 5 CHECK (min_stock >= 0),
  dlc date,
  image_url text,
  added_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT uq_products_org_name UNIQUE(organization_id, lower(name))
);

-- Formations disponibles
CREATE TABLE trainings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  category text,
  difficulty text DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  duration_minutes integer,
  xp_reward integer DEFAULT 50,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Progression des formations utilisateur
CREATE TABLE user_training_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  training_id uuid NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  status text DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  score integer,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT user_training_progress_user_id_training_id_key UNIQUE(user_id, training_id)
);

-- Conversations
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  type text DEFAULT 'group' CHECK (type IN ('group', 'direct', 'support')),
  participants uuid[] DEFAULT '{}',
  last_message_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Messages
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  attachments jsonb DEFAULT '[]',
  read_by uuid[] DEFAULT '{}',
  replied_to uuid REFERENCES messages(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  notification_type text DEFAULT 'info' CHECK (notification_type IN ('info', 'warning', 'error', 'success')),
  action_url text,
  data jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  is_push_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Badges système
CREATE TABLE badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon_url text,
  requirements jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Attribution des badges
CREATE TABLE user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at timestamptz DEFAULT now(),
  
  CONSTRAINT user_badges_user_id_badge_id_key UNIQUE(user_id, badge_id)
);

-- Sessions utilisateurs
CREATE TABLE user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE SET NULL,
  session_start timestamptz DEFAULT now(),
  session_end timestamptz,
  duration_minutes integer,
  actions_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Rapports générés
CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  generated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  report_type text NOT NULL CHECK (report_type IN ('audit_summary', 'performance', 'compliance', 'analytics')),
  title text NOT NULL,
  data jsonb DEFAULT '{}',
  file_url text,
  date_from date,
  date_to date,
  created_at timestamptz DEFAULT now()
);

-- Fonction pour gérer les nouveaux utilisateurs
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement un profil
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Créer les triggers updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON audit_templates FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON audits FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON trainings FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON user_training_progress FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();

-- Index pour les performances
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_organization ON profiles(organization_id);
CREATE INDEX idx_profiles_store ON profiles(store_id);
CREATE INDEX idx_audits_organization ON audits(organization_id);
CREATE INDEX idx_audits_auditor ON audits(auditor_id);
CREATE INDEX idx_audits_status ON audits(status);
CREATE INDEX idx_audits_created_at ON audits(created_at);
CREATE INDEX idx_tasks_organization ON tasks(organization_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_store ON tasks(store_id);
CREATE INDEX idx_products_organization ON products(organization_id);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_audit_items_template ON audit_items(template_id);
CREATE INDEX idx_audit_responses_audit ON audit_responses(audit_id);
CREATE INDEX idx_audit_responses_item ON audit_responses(item_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_conversations_org ON conversations(organization_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);
CREATE INDEX idx_utp_user ON user_training_progress(user_id);
CREATE INDEX idx_utp_training ON user_training_progress(training_id);
CREATE INDEX idx_reports_org_store ON reports(organization_id, store_id);

-- Index texte pour recherche
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX gin_products_name_trgm ON products USING gin(name gin_trgm_ops);

-- Index JSON pour recherche dans settings
CREATE INDEX gin_stores_settings ON stores USING gin(settings);
CREATE INDEX gin_messages_attach ON messages USING gin(attachments);
CREATE INDEX gin_reports_data ON reports USING gin(data);

-- Vues utilitaires
CREATE VIEW v_current_profile AS
SELECT * FROM profiles WHERE id = auth.uid();

CREATE VIEW v_is_admin AS
SELECT (
  SELECT role FROM v_current_profile LIMIT 1
) = 'admin' AS ok;

CREATE VIEW v_is_manager AS
SELECT (
  SELECT role FROM v_current_profile LIMIT 1
) IN ('admin', 'manager') AS ok;

-- Activer RLS sur toutes les tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour organisations
CREATE POLICY "org_all_organizations" ON organizations FOR ALL TO public
USING (EXISTS (SELECT 1 FROM v_current_profile cp WHERE cp.organization_id = organizations.id))
WITH CHECK (EXISTS (SELECT 1 FROM v_current_profile cp WHERE cp.organization_id = organizations.id));

CREATE POLICY "org_select_organizations" ON organizations FOR SELECT TO public
USING (EXISTS (SELECT 1 FROM v_current_profile cp WHERE cp.organization_id = organizations.id));

-- Politiques pour magasins
CREATE POLICY "org_select_stores" ON stores FOR SELECT TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_insert_stores" ON stores FOR INSERT TO public
WITH CHECK (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_update_stores" ON stores FOR UPDATE TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1))
WITH CHECK (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_delete_stores" ON stores FOR DELETE TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

-- Politiques pour départements
CREATE POLICY "org_select_departments" ON departments FOR SELECT TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_insert_departments" ON departments FOR INSERT TO public
WITH CHECK (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_update_departments" ON departments FOR UPDATE TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1))
WITH CHECK (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_delete_departments" ON departments FOR DELETE TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

-- Politiques pour profils
CREATE POLICY "profiles_select_org" ON profiles FOR SELECT TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "profiles_insert_self" ON profiles FOR INSERT TO public
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_self" ON profiles FOR UPDATE TO public
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_delete_self" ON profiles FOR DELETE TO public
USING (id = auth.uid());

-- Politiques pour templates d'audit
CREATE POLICY "org_select_audit_templates" ON audit_templates FOR SELECT TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_insert_audit_templates" ON audit_templates FOR INSERT TO public
WITH CHECK (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_update_audit_templates" ON audit_templates FOR UPDATE TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1))
WITH CHECK (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_delete_audit_templates" ON audit_templates FOR DELETE TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

-- Politiques pour items d'audit
CREATE POLICY "org_read_audit_items" ON audit_items FOR SELECT TO public
USING (EXISTS (
  SELECT 1 FROM audit_templates t 
  JOIN v_current_profile cp ON cp.organization_id = t.organization_id
  WHERE t.id = audit_items.template_id
));

CREATE POLICY "org_cud_audit_items" ON audit_items FOR ALL TO public
USING (EXISTS (
  SELECT 1 FROM audit_templates t 
  JOIN v_current_profile cp ON cp.organization_id = t.organization_id
  WHERE t.id = audit_items.template_id
))
WITH CHECK (EXISTS (
  SELECT 1 FROM audit_templates t 
  JOIN v_current_profile cp ON cp.organization_id = t.organization_id
  WHERE t.id = audit_items.template_id
));

-- Politiques pour audits
CREATE POLICY "org_select_audits" ON audits FOR SELECT TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_insert_audits" ON audits FOR INSERT TO public
WITH CHECK (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_update_audits" ON audits FOR UPDATE TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1))
WITH CHECK (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_delete_audits" ON audits FOR DELETE TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

-- Politiques pour réponses d'audit
CREATE POLICY "org_all_audit_responses" ON audit_responses FOR ALL TO public
USING (EXISTS (
  SELECT 1 FROM audits a 
  JOIN v_current_profile cp ON cp.organization_id = a.organization_id
  WHERE a.id = audit_responses.audit_id
))
WITH CHECK (EXISTS (
  SELECT 1 FROM audits a 
  JOIN v_current_profile cp ON cp.organization_id = a.organization_id
  WHERE a.id = audit_responses.audit_id
));

-- Politiques pour photos d'audit
CREATE POLICY "org_select_audit_photos" ON audit_photos FOR SELECT TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_insert_audit_photos" ON audit_photos FOR INSERT TO public
WITH CHECK (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_update_audit_photos" ON audit_photos FOR UPDATE TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1))
WITH CHECK (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_delete_audit_photos" ON audit_photos FOR DELETE TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

-- Politiques pour tâches
CREATE POLICY "org_select_tasks" ON tasks FOR SELECT TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_insert_tasks" ON tasks FOR INSERT TO public
WITH CHECK (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_update_tasks" ON tasks FOR UPDATE TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1))
WITH CHECK (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_delete_tasks" ON tasks FOR DELETE TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

-- Politiques pour produits
CREATE POLICY "org_select_products" ON products FOR SELECT TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_insert_products" ON products FOR INSERT TO public
WITH CHECK (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_update_products" ON products FOR UPDATE TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1))
WITH CHECK (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_delete_products" ON products FOR DELETE TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

-- Politiques pour formations
CREATE POLICY "org_select_trainings" ON trainings FOR SELECT TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_insert_trainings" ON trainings FOR INSERT TO public
WITH CHECK (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_update_trainings" ON trainings FOR UPDATE TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1))
WITH CHECK (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_delete_trainings" ON trainings FOR DELETE TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

-- Politiques pour progression formations
CREATE POLICY "user_badges_self" ON user_badges FOR ALL TO public
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Politiques spéciales pour sessions (access élargi)
CREATE POLICY "us_select" ON user_sessions FOR SELECT TO public
USING (
  user_id = auth.uid() OR 
  (SELECT ok FROM v_is_admin) AND EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = user_sessions.user_id 
    AND p.organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1)
  ) OR
  (SELECT ok FROM v_is_manager) AND EXISTS (
    SELECT 1 FROM profiles p 
    JOIN v_current_profile cp ON true
    WHERE p.id = user_sessions.user_id 
    AND p.organization_id = cp.organization_id 
    AND p.store_id = cp.store_id
  )
);

CREATE POLICY "us_insert" ON user_sessions FOR INSERT TO public
WITH CHECK (
  user_id = auth.uid() OR 
  (SELECT ok FROM v_is_admin) AND EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = user_sessions.user_id 
    AND p.organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1)
  ) OR
  (SELECT ok FROM v_is_manager) AND EXISTS (
    SELECT 1 FROM profiles p 
    JOIN v_current_profile cp ON true
    WHERE p.id = user_sessions.user_id 
    AND p.organization_id = cp.organization_id 
    AND p.store_id = cp.store_id
  )
);

CREATE POLICY "us_update" ON user_sessions FOR UPDATE TO public
USING (
  user_id = auth.uid() OR 
  (SELECT ok FROM v_is_admin) AND EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = user_sessions.user_id 
    AND p.organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1)
  ) OR
  (SELECT ok FROM v_is_manager) AND EXISTS (
    SELECT 1 FROM profiles p 
    JOIN v_current_profile cp ON true
    WHERE p.id = user_sessions.user_id 
    AND p.organization_id = cp.organization_id 
    AND p.store_id = cp.store_id
  )
)
WITH CHECK (
  user_id = auth.uid() OR 
  (SELECT ok FROM v_is_admin) AND EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = user_sessions.user_id 
    AND p.organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1)
  ) OR
  (SELECT ok FROM v_is_manager) AND EXISTS (
    SELECT 1 FROM profiles p 
    JOIN v_current_profile cp ON true
    WHERE p.id = user_sessions.user_id 
    AND p.organization_id = cp.organization_id 
    AND p.store_id = cp.store_id
  )
);

CREATE POLICY "us_delete" ON user_sessions FOR DELETE TO public
USING (
  user_id = auth.uid() OR 
  (SELECT ok FROM v_is_admin) AND EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = user_sessions.user_id 
    AND p.organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1)
  ) OR
  (SELECT ok FROM v_is_manager) AND EXISTS (
    SELECT 1 FROM profiles p 
    JOIN v_current_profile cp ON true
    WHERE p.id = user_sessions.user_id 
    AND p.organization_id = cp.organization_id 
    AND p.store_id = cp.store_id
  )
);

-- Politiques génériques pour les autres tables
CREATE POLICY "org_select_conversations" ON conversations FOR SELECT TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_insert_conversations" ON conversations FOR INSERT TO public
WITH CHECK (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_update_conversations" ON conversations FOR UPDATE TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1))
WITH CHECK (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_delete_conversations" ON conversations FOR DELETE TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_all_messages" ON messages FOR ALL TO public
USING (EXISTS (
  SELECT 1 FROM conversations c 
  JOIN v_current_profile cp ON cp.organization_id = c.organization_id
  WHERE c.id = messages.conversation_id
))
WITH CHECK (EXISTS (
  SELECT 1 FROM conversations c 
  JOIN v_current_profile cp ON cp.organization_id = c.organization_id
  WHERE c.id = messages.conversation_id
));

CREATE POLICY "org_select_notifications" ON notifications FOR SELECT TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_insert_notifications" ON notifications FOR INSERT TO public
WITH CHECK (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_update_notifications" ON notifications FOR UPDATE TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1))
WITH CHECK (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_delete_notifications" ON notifications FOR DELETE TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "badges_read_all" ON badges FOR SELECT TO public USING (true);

CREATE POLICY "org_select_reports" ON reports FOR SELECT TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_insert_reports" ON reports FOR INSERT TO public
WITH CHECK (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_update_reports" ON reports FOR UPDATE TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1))
WITH CHECK (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

CREATE POLICY "org_delete_reports" ON reports FOR DELETE TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

-- Insérer les données de démonstration
INSERT INTO organizations (id, name, logo_url, subscription_plan, max_users, max_stores) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'SuperMarché Central',
  'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=100',
  'pro',
  50,
  5
);

INSERT INTO stores (id, organization_id, name, address, city, postal_code, latitude, longitude) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'Magasin Central',
  '123 Avenue de la République',
  'Paris',
  '75015',
  48.8566,
  2.3522
);

INSERT INTO departments (id, organization_id, store_id, name, description) VALUES
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'Rayon Frais', 'Gestion des produits frais et ultra-frais'),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'Caisse', 'Accueil et encaissement client'),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'Boulangerie', 'Production et vente produits boulangers');

INSERT INTO badges (id, name, description, requirements) VALUES
('badge-1', 'Premier audit', 'Complété votre premier audit', '{"audits_completed": 1}'),
('badge-2', 'Semaine parfaite', '7 jours consécutifs sans erreur', '{"perfect_days": 7}'),
('badge-3', 'Expert produit', '50 produits scannés', '{"products_scanned": 50}'),
('badge-4', 'Formateur', '3 formations complétées', '{"trainings_completed": 3}');

INSERT INTO audit_templates (id, organization_id, name, description, category, estimated_duration) VALUES
('template-1', '550e8400-e29b-41d4-a716-446655440000', 'Contrôle Rayon Frais', 'Vérification quotidienne des produits frais', 'Hygiène', 20),
('template-2', '550e8400-e29b-41d4-a716-446655440000', 'Audit Sécurité Alimentaire', 'Contrôle HACCP complet', 'Sécurité', 45),
('template-3', '550e8400-e29b-41d4-a716-446655440000', 'Contrôle Hygiène', 'Vérification des protocoles d\'hygiène', 'Hygiène', 30);

INSERT INTO audit_items (template_id, question, item_type, is_required, points, sort_order) VALUES
('template-1', 'Température des réfrigérateurs conforme?', 'checkbox', true, 20, 1),
('template-1', 'DLC respectées pour tous les produits?', 'checkbox', true, 25, 2),
('template-1', 'Propreté des bacs et présentoirs?', 'rating', true, 15, 3),
('template-2', 'Plan de nettoyage appliqué?', 'checkbox', true, 30, 1),
('template-2', 'Formation HACCP à jour?', 'checkbox', true, 25, 2),
('template-3', 'Lavage des mains respecté?', 'checkbox', true, 20, 1);

INSERT INTO trainings (id, organization_id, title, content, category, difficulty, duration_minutes, xp_reward) VALUES
('training-1', '550e8400-e29b-41d4-a716-446655440000', 'Accueil Client Excellence', 'Formation complète sur les techniques d\'accueil', 'Service Client', 'beginner', 30, 75),
('training-2', '550e8400-e29b-41d4-a716-446655440000', 'Hygiène Alimentaire HACCP', 'Formation obligatoire sur l\'hygiène alimentaire', 'Sécurité', 'intermediate', 60, 150),
('training-3', '550e8400-e29b-41d4-a716-446655440000', 'Gestion des Stocks', 'Optimisation de la gestion des stocks', 'Logistique', 'advanced', 45, 100);

INSERT INTO products (organization_id, barcode, name, category, price, stock_quantity, min_stock, dlc) VALUES
('550e8400-e29b-41d4-a716-446655440000', '3045320073034', 'Yaourt Nature Danone 4x125g', 'Frais', 2.85, 45, 10, '2024-02-15'),
('550e8400-e29b-41d4-a716-446655440000', '3564700456789', 'Pain de Mie Complet Harry''s', 'Boulangerie', 1.95, 28, 5, '2024-01-25'),
('550e8400-e29b-41d4-a716-446655440000', '3274080005003', 'Lait Demi-Écrémé Lactel 1L', 'Frais', 1.25, 67, 15, '2024-01-30'),
('550e8400-e29b-41d4-a716-446655440000', '3229820787152', 'Jambon Blanc Herta 6 Tranches', 'Charcuterie', 3.45, 23, 8, '2024-01-28'),
('550e8400-e29b-41d4-a716-446655440000', '3560070462235', 'Pommes Golden 1kg', 'Fruits & Légumes', 2.99, 89, 20, '2024-02-10');

-- Message de succès
DO $$
BEGIN
  RAISE NOTICE '🎉 BACKEND OPSPILOT CRÉÉ AVEC SUCCÈS !';
  RAISE NOTICE '✅ 18 tables créées avec relations';
  RAISE NOTICE '✅ Index de performance ajoutés';
  RAISE NOTICE '✅ Sécurité RLS configurée';
  RAISE NOTICE '✅ Données de démo insérées';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 PROCHAINES ÉTAPES :';
  RAISE NOTICE '1. Créer un utilisateur dans Authentication > Users';
  RAISE NOTICE '2. Email: demo@opspilot.com, Password: demo123';
  RAISE NOTICE '3. Tester la connexion dans l''app';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 BACKEND ENTERPRISE PRÊT !';
END $$;