/*
🚀 SCRIPT SUPABASE COMPLET - OPSPILOT
Base de données Enterprise complète avec utilisateur démo
*/

-- =========================================
-- 🧹 NETTOYAGE INITIAL
-- =========================================

-- Supprimer toutes les tables existantes (ordre important pour les contraintes)
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.user_badges CASCADE;
DROP TABLE IF EXISTS public.badges CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.user_training_progress CASCADE;
DROP TABLE IF EXISTS public.trainings CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.audit_photos CASCADE;
DROP TABLE IF EXISTS public.audit_responses CASCADE;
DROP TABLE IF EXISTS public.audit_items CASCADE;
DROP TABLE IF EXISTS public.audits CASCADE;
DROP TABLE IF EXISTS public.audit_templates CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- =========================================
-- 🏢 TABLES PRINCIPALES
-- =========================================

-- Table des organisations (multi-tenant)
CREATE TABLE public.organizations (
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

-- Table des magasins/points de vente
CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
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

-- Table des départements/services
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  manager_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Table des profils utilisateurs (liée à auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  email text NOT NULL,
  full_name text,
  phone text,
  avatar_url text,
  role text DEFAULT 'employé' CHECK (role IN ('admin', 'manager', 'employé', 'stagiaire')),
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  level integer DEFAULT 1,
  xp integer DEFAULT 0,
  total_audits integer DEFAULT 0,
  avg_score integer DEFAULT 0,
  completed_trainings integer DEFAULT 0,
  active_time_hours integer DEFAULT 0,
  last_active timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =========================================
-- 📊 TABLES AUDITS
-- =========================================

-- Templates d'audits
CREATE TABLE public.audit_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text,
  estimated_duration integer,
  max_score integer DEFAULT 100,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Items/questions d'audit
CREATE TABLE public.audit_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.audit_templates(id) ON DELETE CASCADE,
  question text NOT NULL,
  item_type text DEFAULT 'checkbox' CHECK (item_type IN ('checkbox', 'rating', 'text', 'photo', 'numeric')),
  is_required boolean DEFAULT false,
  points integer DEFAULT 10,
  sort_order integer DEFAULT 0,
  options jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- Audits réalisés
CREATE TABLE public.audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.audit_templates(id) ON DELETE SET NULL,
  auditor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  location text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  score integer,
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
CREATE TABLE public.audit_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.audit_items(id) ON DELETE CASCADE,
  response_value text,
  score integer DEFAULT 0,
  notes text,
  photos text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Photos d'audit avec annotations
CREATE TABLE public.audit_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  audit_id uuid NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  comment text,
  file_size integer,
  annotations jsonb DEFAULT '[]',
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- =========================================
-- ✅ TABLES TÂCHES
-- =========================================

-- Tâches et actions terrain
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
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

-- =========================================
-- 📦 TABLES PRODUITS
-- =========================================

-- Gestion des produits
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  barcode text,
  name text NOT NULL,
  category text,
  price numeric(10,2),
  stock_quantity integer DEFAULT 0,
  min_stock integer DEFAULT 5,
  dlc date,
  image_url text,
  added_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =========================================
-- 🎓 TABLES FORMATION
-- =========================================

-- Formations disponibles
CREATE TABLE public.trainings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
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

-- Progression des utilisateurs dans les formations
CREATE TABLE public.user_training_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  training_id uuid NOT NULL REFERENCES public.trainings(id) ON DELETE CASCADE,
  status text DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percentage integer DEFAULT 0,
  score integer,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, training_id)
);

-- =========================================
-- 💬 TABLES COMMUNICATION
-- =========================================

-- Conversations/channels
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  type text DEFAULT 'group' CHECK (type IN ('group', 'direct', 'support')),
  participants uuid[] DEFAULT '{}',
  last_message_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Messages
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  attachments jsonb DEFAULT '[]',
  read_by uuid[] DEFAULT '{}',
  replied_to uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- =========================================
-- 🔔 TABLES NOTIFICATIONS
-- =========================================

-- Notifications push/système
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  notification_type text DEFAULT 'info' CHECK (notification_type IN ('info', 'warning', 'error', 'success')),
  action_url text,
  data jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  is_push_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- =========================================
-- 🏆 TABLES GAMIFICATION
-- =========================================

-- Badges disponibles
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon_url text,
  requirements jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Badges obtenus par les utilisateurs
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id uuid REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- =========================================
-- 📈 TABLES ANALYTICS
-- =========================================

-- Sessions utilisateur pour analytics
CREATE TABLE public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  session_start timestamptz DEFAULT now(),
  session_end timestamptz,
  duration_minutes integer,
  actions_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Rapports générés
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  generated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  report_type text NOT NULL CHECK (report_type IN ('audit_summary', 'performance', 'compliance', 'analytics')),
  title text NOT NULL,
  data jsonb DEFAULT '{}',
  file_url text,
  date_from date,
  date_to date,
  created_at timestamptz DEFAULT now()
);

-- =========================================
-- 🔒 SÉCURITÉ RLS
-- =========================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour développement (permissives)
CREATE POLICY "Enable all for development" ON public.organizations FOR ALL TO public USING (true);
CREATE POLICY "Enable all for development" ON public.stores FOR ALL TO public USING (true);
CREATE POLICY "Enable all for development" ON public.departments FOR ALL TO public USING (true);
CREATE POLICY "Enable all for development" ON public.profiles FOR ALL TO public USING (true);
CREATE POLICY "Enable all for development" ON public.audit_templates FOR ALL TO public USING (true);
CREATE POLICY "Enable all for development" ON public.audit_items FOR ALL TO public USING (true);
CREATE POLICY "Enable all for development" ON public.audits FOR ALL TO public USING (true);
CREATE POLICY "Enable all for development" ON public.audit_responses FOR ALL TO public USING (true);
CREATE POLICY "Enable all for development" ON public.audit_photos FOR ALL TO public USING (true);
CREATE POLICY "Enable all for development" ON public.tasks FOR ALL TO public USING (true);
CREATE POLICY "Enable all for development" ON public.products FOR ALL TO public USING (true);
CREATE POLICY "Enable all for development" ON public.trainings FOR ALL TO public USING (true);
CREATE POLICY "Enable all for development" ON public.user_training_progress FOR ALL TO public USING (true);
CREATE POLICY "Enable all for development" ON public.conversations FOR ALL TO public USING (true);
CREATE POLICY "Enable all for development" ON public.messages FOR ALL TO public USING (true);
CREATE POLICY "Enable all for development" ON public.notifications FOR ALL TO public USING (true);
CREATE POLICY "Enable all for development" ON public.badges FOR ALL TO public USING (true);
CREATE POLICY "Enable all for development" ON public.user_badges FOR ALL TO public USING (true);
CREATE POLICY "Enable all for development" ON public.user_sessions FOR ALL TO public USING (true);
CREATE POLICY "Enable all for development" ON public.reports FOR ALL TO public USING (true);

-- =========================================
-- 📈 INDEX DE PERFORMANCE
-- =========================================

-- Index pour les profiles
CREATE INDEX IF NOT EXISTS idx_profiles_organization ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_store ON public.profiles(store_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Index pour les audits
CREATE INDEX IF NOT EXISTS idx_audits_organization ON public.audits(organization_id);
CREATE INDEX IF NOT EXISTS idx_audits_auditor ON public.audits(auditor_id);
CREATE INDEX IF NOT EXISTS idx_audits_status ON public.audits(status);
CREATE INDEX IF NOT EXISTS idx_audits_created_at ON public.audits(created_at DESC);

-- Index pour les tâches
CREATE INDEX IF NOT EXISTS idx_tasks_organization ON public.tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);

-- Index pour les produits
CREATE INDEX IF NOT EXISTS idx_products_organization ON public.products(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);

-- Index pour les messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Index pour les notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- =========================================
-- 🤖 FONCTION DE CRÉATION AUTOMATIQUE DE PROFIL
-- =========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Créer automatiquement un profil pour chaque nouvel utilisateur
  INSERT INTO public.profiles (
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
    active_time_hours,
    is_active
  ) VALUES (
    NEW.id,
    '550e8400-e29b-41d4-a716-446655440000', -- Organisation par défaut
    '550e8400-e29b-41d4-a716-446655440001', -- Magasin par défaut
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'employé',
    1,
    0,
    0,
    0,
    0,
    0,
    true
  );
  
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Trigger pour créer automatiquement le profil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =========================================
-- 🎯 DONNÉES DE DÉMONSTRATION
-- =========================================

-- Créer l'utilisateur démo dans auth.users (CRUCIAL!)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '550e8400-e29b-41d4-a716-446655440100',
  '00000000-0000-0000-0000-000000000000',
  'demo@opspilot.com',
  crypt('demo123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Utilisateur Démo"}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Organisation de démonstration
INSERT INTO public.organizations (id, name, subscription_plan, max_users, max_stores) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'SuperMarché Central', 'enterprise', 500, 50);

-- Magasins de démonstration
INSERT INTO public.stores (id, organization_id, name, address, city, postal_code, country, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Magasin Central', '123 Rue du Commerce', 'Paris', '75015', 'France', true),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Magasin Banlieue', '456 Avenue des Platanes', 'Boulogne', '92100', 'France', true);

-- Départements
INSERT INTO public.departments (id, organization_id, store_id, name, description) VALUES
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'Rayon Frais', 'Produits frais et laitages'),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'Boulangerie', 'Boulangerie et pâtisserie'),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'Accueil', 'Caisses et service client');

-- Profil pour l'utilisateur démo
INSERT INTO public.profiles (
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
  active_time_hours,
  is_active
) VALUES (
  '550e8400-e29b-41d4-a716-446655440100',
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440001',
  'demo@opspilot.com',
  'Utilisateur Démo',
  'manager',
  5,
  1250,
  15,
  85,
  3,
  120,
  true
) ON CONFLICT (id) DO NOTHING;

-- Profils d'employés de démonstration
INSERT INTO public.profiles (id, organization_id, store_id, email, full_name, role, department_id, level, xp, total_audits, avg_score, completed_trainings, active_time_hours, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'marie@supermarche.com', 'Marie Dupont', 'manager', '550e8400-e29b-41d4-a716-446655440010', 4, 850, 47, 92, 12, 156, true),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'pierre@supermarche.com', 'Pierre Martin', 'employé', '550e8400-e29b-41d4-a716-446655440011', 3, 642, 35, 87, 8, 134, true),
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'jean@supermarche.com', 'Jean Leroy', 'employé', '550e8400-e29b-41d4-a716-446655440012', 2, 378, 28, 79, 5, 98, true);

-- Templates d'audit
INSERT INTO public.audit_templates (id, organization_id, name, description, category, estimated_duration, max_score, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440000', 'Contrôle Rayon Frais', 'Audit quotidien du rayon frais et laitages', 'Hygiène', 20, 100, true),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440000', 'Audit Sécurité Alimentaire', 'Contrôle HACCP et température', 'Sécurité', 45, 100, true),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440000', 'Contrôle Merchandising', 'Vérification mise en rayon et prix', 'Commercial', 30, 100, true);

-- Audits de démonstration
INSERT INTO public.audits (id, organization_id, store_id, template_id, auditor_id, title, description, location, status, score, max_score, issues_count, started_at, completed_at, due_date) VALUES
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440020', 'Contrôle rayon frais matinal', 'Audit quotidien - contrôle DLC et température', 'Rayon frais', 'completed', 95, 100, 1, now() - interval '2 hours', now() - interval '1 hour', now() + interval '6 hours'),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440021', 'Audit sécurité hebdomadaire', 'Contrôle HACCP et procédures', 'Zone de préparation', 'in_progress', null, 100, 0, now() - interval '30 minutes', null, now() + interval '4 hours'),
('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440022', 'Contrôle merchandising', 'Vérification des prix et étiquetage', 'Rayons centraux', 'pending', null, 100, 0, null, null, now() + interval '2 hours');

-- Tâches de démonstration
INSERT INTO public.tasks (id, organization_id, store_id, assigned_to, created_by, title, description, location, priority, status, estimated_time_minutes, due_date, completed_at) VALUES
('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440020', 'Vérification DLC rayon frais', 'Contrôler toutes les DLC des produits laitiers', 'Rayon frais', 'high', 'completed', 30, now() + interval '2 hours', now() - interval '15 minutes'),
('550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440020', 'Réapprovisionnement pain', 'Commander et réceptionner livraison boulangerie', 'Zone de réception', 'medium', 'in_progress', 45, now() + interval '3 hours', null),
('550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440020', 'Formation nouveau caissier', 'Accompagner le stagiaire sur les procédures caisse', 'Caisses', 'low', 'pending', 60, now() + interval '1 day', null);

-- Produits de démonstration
INSERT INTO public.products (id, organization_id, barcode, name, category, price, stock_quantity, min_stock, dlc) VALUES
('550e8400-e29b-41d4-a716-446655440060', '550e8400-e29b-41d4-a716-446655440000', '3045320073034', 'Yaourt Nature Danone 4x125g', 'Frais', 2.85, 45, 10, current_date + interval '10 days'),
('550e8400-e29b-41d4-a716-446655440061', '550e8400-e29b-41d4-a716-446655440000', '3564700456789', 'Pain de Mie Complet Harry''s', 'Boulangerie', 1.95, 23, 15, current_date + interval '5 days'),
('550e8400-e29b-41d4-a716-446655440062', '550e8400-e29b-41d4-a716-446655440000', '3274080005003', 'Lait Demi-Écrémé Lactel 1L', 'Frais', 1.25, 67, 20, current_date + interval '7 days'),
('550e8400-e29b-41d4-a716-446655440063', '550e8400-e29b-41d4-a716-446655440000', '3229820787152', 'Jambon Blanc Herta 6 Tranches', 'Charcuterie', 3.45, 12, 8, current_date + interval '12 days'),
('550e8400-e29b-41d4-a716-446655440064', '550e8400-e29b-41d4-a716-446655440000', '3560070462235', 'Pommes Golden 1kg', 'Fruits & Légumes', 2.99, 89, 25, current_date + interval '4 days');

-- Formations de démonstration
INSERT INTO public.trainings (id, organization_id, title, content, category, difficulty, duration_minutes, xp_reward, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440070', '550e8400-e29b-41d4-a716-446655440000', 'Accueil Client Excellence', 'Formation sur les meilleures pratiques d''accueil client', 'Service Client', 'beginner', 25, 50, true),
('550e8400-e29b-41d4-a716-446655440071', '550e8400-e29b-41d4-a716-446655440000', 'Hygiène et Sécurité Alimentaire', 'Formation HACCP obligatoire pour la manipulation des aliments', 'Sécurité', 'intermediate', 45, 100, true),
('550e8400-e29b-41d4-a716-446655440072', '550e8400-e29b-41d4-a716-446655440000', 'Gestion des Stocks', 'Optimisation des stocks et gestion des commandes', 'Gestion', 'advanced', 60, 150, true);

-- Conversations de démonstration
INSERT INTO public.conversations (id, organization_id, name, description, type, participants) VALUES
('550e8400-e29b-41d4-a716-446655440070', '550e8400-e29b-41d4-a716-446655440000', 'Équipe Magasin', 'Chat principal de l''équipe', 'group', '{}'),
('550e8400-e29b-41d4-a716-446655440071', '550e8400-e29b-41d4-a716-446655440000', 'Support Technique', 'Support IT et maintenance', 'support', '{}'),
('550e8400-e29b-41d4-a716-446655440072', '550e8400-e29b-41d4-a716-446655440000', 'Direction Régionale', 'Communication management', 'group', '{}');

-- Badges de démonstration
INSERT INTO public.badges (id, name, description, requirements) VALUES
('550e8400-e29b-41d4-a716-446655440080', 'Premier Audit', 'Terminer son premier audit', '{"audits_completed": 1}'),
('550e8400-e29b-41d4-a716-446655440081', 'Expert Scanner', 'Scanner 100 produits', '{"products_scanned": 100}'),
('550e8400-e29b-41d4-a716-446655440082', 'Formateur', 'Terminer 5 formations', '{"trainings_completed": 5}'),
('550e8400-e29b-41d4-a716-446655440083', 'Semaine Parfaite', '7 jours sans erreur d''audit', '{"perfect_days": 7}');

-- Attribution des badges
INSERT INTO public.user_badges (user_id, badge_id, awarded_at) VALUES
('550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440080', now() - interval '5 days'),
('550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440081', now() - interval '2 days');

-- =========================================
-- 🎉 CONFIRMATION FINALE
-- =========================================

DO $$
BEGIN
  RAISE NOTICE '🎉 BACKEND OPSPILOT CRÉÉ AVEC SUCCÈS !';
  RAISE NOTICE '✅ % tables créées avec relations', (
    SELECT count(*) FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name NOT LIKE 'pg_%'
  );
  RAISE NOTICE '✅ Index de performance ajoutés';
  RAISE NOTICE '✅ Sécurité RLS configurée';
  RAISE NOTICE '✅ Utilisateur démo: demo@opspilot.com / demo123';
  RAISE NOTICE '✅ Données de démo insérées';
  RAISE NOTICE '🚀 Application prête à utiliser !';
END $$;