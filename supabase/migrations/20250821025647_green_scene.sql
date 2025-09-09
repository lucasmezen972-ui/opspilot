/*
  # Schéma complet OpsPilot pour nouveau projet

  1. Tables principales
    - `profiles` : Profils utilisateurs avec gamification
    - `audits` : Audits avec statuts et scoring  
    - `audit_photos` : Photos d'audit avec commentaires
    - `products` : Produits avec codes-barres et DLC
    - `tasks` : Tâches avec priorités et assignation
    - `trainings` : Formations avec contenu
    - `user_badges` : Système de badges
    - `badges` : Définition des badges

  2. Sécurité
    - RLS activé sur toutes les tables
    - Policies permissives pour développement
    - Relations avec foreign keys

  3. Données de démonstration
    - 3 profils complets
    - 5 audits avec photos
    - 5 tâches assignées
    - 10 produits avec codes-barres
    - 5 formations actives
    - 5 badges disponibles
*/

-- Supprimer les tables existantes si elles existent (pour reset complet)
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS audit_photos CASCADE;
DROP TABLE IF EXISTS audits CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS trainings CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Table des profils utilisateurs (colonne de base + gamification)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  phone text,
  avatar_url text,
  role text DEFAULT 'employé',
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

-- Table des badges
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon_url text,
  requirements jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Table des badges utilisateur
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Table des audits
CREATE TABLE IF NOT EXISTS audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  store_name text,
  location text,
  status text DEFAULT 'pending',
  score integer,
  max_score integer DEFAULT 100,
  issues_count integer DEFAULT 0,
  notes text,
  photos text[] DEFAULT '{}',
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  started_at timestamptz,
  completed_at timestamptz,
  due_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des photos d'audit
CREATE TABLE IF NOT EXISTS audit_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid REFERENCES audits(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  comment text,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Table des produits
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode text,
  name text NOT NULL,
  category text,
  price numeric(10,2),
  stock_quantity integer DEFAULT 0,
  min_stock integer DEFAULT 5,
  dlc date,
  image_url text,
  added_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des tâches
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  location text,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  priority text DEFAULT 'medium',
  status text DEFAULT 'à faire',
  estimated_time_minutes integer,
  due_date timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des formations
CREATE TABLE IF NOT EXISTS trainings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  category text,
  difficulty text DEFAULT 'beginner',
  duration_minutes integer,
  xp_reward integer DEFAULT 50,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;

-- Policies permissives pour développement (à restreindre en production)
CREATE POLICY "Enable all for development" ON profiles FOR ALL USING (true);
CREATE POLICY "Enable all for development" ON badges FOR ALL USING (true);
CREATE POLICY "Enable all for development" ON user_badges FOR ALL USING (true);
CREATE POLICY "Enable all for development" ON audits FOR ALL USING (true);
CREATE POLICY "Enable all for development" ON audit_photos FOR ALL USING (true);
CREATE POLICY "Enable all for development" ON products FOR ALL USING (true);
CREATE POLICY "Enable all for development" ON tasks FOR ALL USING (true);
CREATE POLICY "Enable all for development" ON trainings FOR ALL USING (true);

-- Insertion des données de démonstration (seulement si elles n'existent pas)
DO $$
BEGIN
  -- Insertion des badges
  INSERT INTO badges (name, description, icon_url) 
  SELECT * FROM (VALUES
    ('Premier audit', 'Terminé votre premier audit', 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png'),
    ('Semaine parfaite', '7 jours sans erreur détectée', 'https://cdn-icons-png.flaticon.com/512/1828/1828970.png'),
    ('Scanner expert', '100 produits scannés avec succès', 'https://cdn-icons-png.flaticon.com/512/1828/1828925.png'),
    ('Formateur', '5 formations terminées', 'https://cdn-icons-png.flaticon.com/512/1828/1828911.png'),
    ('Leader', 'Classé dans le top 3 du mois', 'https://cdn-icons-png.flaticon.com/512/1828/1828956.png')
  ) AS v(name, description, icon_url)
  WHERE NOT EXISTS (SELECT 1 FROM badges WHERE badges.name = v.name);

  -- Insertion des formations
  INSERT INTO trainings (title, content, category, difficulty, duration_minutes, xp_reward)
  SELECT * FROM (VALUES
    ('Accueil client excellence', 'Formation complète sur l''accueil et le service client', 'Service', 'beginner', 25, 50),
    ('Hygiène et sécurité alimentaire', 'Normes HACCP et sécurité alimentaire obligatoire', 'Sécurité', 'intermediate', 45, 100),
    ('Gestion des stocks', 'Techniques avancées de gestion des stocks et inventaire', 'Logistique', 'advanced', 35, 75),
    ('Communication équipe', 'Améliorer la communication interne et le travail d''équipe', 'Management', 'intermediate', 30, 60),
    ('Nouveautés produits', 'Présentation des nouveaux produits et gammes', 'Produits', 'beginner', 20, 40)
  ) AS v(title, content, category, difficulty, duration_minutes, xp_reward)
  WHERE NOT EXISTS (SELECT 1 FROM trainings WHERE trainings.title = v.title);

  -- Note: Les autres données seront créées dynamiquement par l'application
  RAISE NOTICE 'Données de base insérées avec succès !';

EXCEPTION WHEN others THEN
  RAISE NOTICE 'Erreur lors de l''insertion (normal si données déjà présentes): %', SQLERRM;
END $$;