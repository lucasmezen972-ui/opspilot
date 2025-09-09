-- 🎯 CRÉATION UTILISATEUR DÉMO OPSPILOT - VERSION CORRIGÉE
-- ===============================================================

/*
  # Création utilisateur démo complet

  1. Organisation de démonstration
  2. Magasin de démonstration  
  3. Département de démonstration
  4. Utilisateur démo avec profil complet
  5. Données de test pour l'application

  Utilisateur de démonstration:
  - Email: demo@opspilot.com
  - Password: demo123
  - Profil: Marie Dupont, Manager
*/

-- ==========================================
-- 1. ORGANISATION DÉMO
-- ==========================================

INSERT INTO public.organizations (
  id,
  name,
  logo_url,
  subscription_plan,
  max_users,
  max_stores,
  settings
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Supermarché Central',
  null,
  'pro',
  50,
  5,
  '{}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = now();

-- ==========================================
-- 2. MAGASIN DÉMO
-- ==========================================

INSERT INTO public.stores (
  id,
  organization_id,
  name,
  address,
  city,
  postal_code,
  country,
  is_active,
  settings
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Magasin Central Paris 15',
  '123 Rue de Commerce',
  'Paris',
  '75015',
  'France',
  true,
  '{}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = now();

-- ==========================================
-- 3. DÉPARTEMENT DÉMO (avec gestion conflit unique)
-- ==========================================

DO $$
BEGIN
  -- Essayer d'insérer le département
  INSERT INTO public.departments (
    id,
    organization_id,
    store_id,
    name,
    description
  ) VALUES (
    '550e8400-e29b-41d4-a716-446655440002'::uuid,
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'Rayon Frais',
    'Département des produits frais et laitiers'
  );
EXCEPTION 
  WHEN unique_violation THEN
    -- Si le département existe déjà, on le met à jour
    UPDATE public.departments 
    SET description = 'Département des produits frais et laitiers'
    WHERE store_id = '550e8400-e29b-41d4-a716-446655440001'::uuid 
      AND LOWER(name) = LOWER('Rayon Frais');
END $$;

-- ==========================================
-- 4. UTILISATEUR DÉMO (public.users uniquement)
-- ==========================================

INSERT INTO public.users (
  id,
  email,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440003'::uuid,
  'demo@opspilot.com',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = now();

-- ==========================================
-- 5. PROFIL UTILISATEUR DÉMO
-- ==========================================

INSERT INTO public.profiles (
  id,
  organization_id,
  store_id,
  email,
  full_name,
  role,
  department_id,
  level,
  xp,
  total_audits,
  avg_score,
  completed_trainings,
  active_time_hours,
  is_active
) VALUES (
  '550e8400-e29b-41d4-a716-446655440003'::uuid,
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'demo@opspilot.com',
  'Marie Dupont',
  'manager',
  '550e8400-e29b-41d4-a716-446655440002'::uuid,
  4,
  850,
  47,
  92,
  12,
  156,
  true
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  level = EXCLUDED.level,
  xp = EXCLUDED.xp,
  total_audits = EXCLUDED.total_audits,
  avg_score = EXCLUDED.avg_score,
  completed_trainings = EXCLUDED.completed_trainings,
  active_time_hours = EXCLUDED.active_time_hours,
  updated_at = now();

-- ==========================================
-- 6. DONNÉES DE DÉMONSTRATION SUPPLÉMENTAIRES
-- ==========================================

-- Quelques audits de démo
INSERT INTO public.audits (
  id,
  organization_id,
  store_id,
  auditor_id,
  title,
  description,
  location,
  status,
  score,
  max_score
) VALUES 
(
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  '550e8400-e29b-41d4-a716-446655440003'::uuid,
  'Contrôle rayon frais matinal',
  'Vérification température et DLC',
  'Rayon frais',
  'completed',
  95,
  100
),
(
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  '550e8400-e29b-41d4-a716-446655440003'::uuid,
  'Audit sécurité alimentaire',
  'Contrôle HACCP complet',
  'Zone de préparation',
  'in_progress',
  null,
  100
) ON CONFLICT (id) DO NOTHING;

-- Quelques tâches de démo
INSERT INTO public.tasks (
  id,
  organization_id,
  store_id,
  assigned_to,
  created_by,
  title,
  description,
  priority,
  status
) VALUES 
(
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  '550e8400-e29b-41d4-a716-446655440003'::uuid,
  '550e8400-e29b-41d4-a716-446655440003'::uuid,
  'Vérification DLC produits laitiers',
  'Contrôler les dates de péremption',
  'high',
  'pending'
),
(
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  '550e8400-e29b-41d4-a716-446655440003'::uuid,
  '550e8400-e29b-41d4-a716-446655440003'::uuid,
  'Formation nouveau caissier',
  'Accueillir et former le nouveau',
  'medium',
  'completed'
) ON CONFLICT (id) DO NOTHING;

-- Quelques produits de démo
INSERT INTO public.products (
  id,
  organization_id,
  name,
  barcode,
  category,
  price,
  stock_quantity,
  min_stock,
  added_by
) VALUES 
(
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Yaourt Nature Danone 4x125g',
  '3045320073034',
  'Frais',
  2.85,
  24,
  5,
  '550e8400-e29b-41d4-a716-446655440003'::uuid
),
(
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Lait Demi-Écrémé Lactel 1L',
  '3274080005003',
  'Frais',
  1.25,
  36,
  10,
  '550e8400-e29b-41d4-a716-446655440003'::uuid
) ON CONFLICT (id) DO NOTHING;

-- Formations de démo
INSERT INTO public.trainings (
  id,
  organization_id,
  title,
  content,
  category,
  difficulty,
  duration_minutes,
  xp_reward,
  is_active
) VALUES 
(
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Accueil client excellence',
  'Formation sur les techniques d''accueil',
  'Service client',
  'beginner',
  25,
  50,
  true
),
(
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Hygiène et sécurité alimentaire',
  'Normes HACCP et sécurité',
  'Sécurité',
  'intermediate',
  45,
  100,
  true
) ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- VÉRIFICATION FINALE
-- ==========================================

-- Afficher les informations de l'utilisateur créé
DO $$
BEGIN
  RAISE NOTICE '🎉 UTILISATEUR DÉMO OPSPILOT CRÉÉ !';
  RAISE NOTICE '📧 Email: demo@opspilot.com';
  RAISE NOTICE '🔑 Password: demo123';
  RAISE NOTICE '👤 Profil: Marie Dupont (Manager)';
  RAISE NOTICE '🏢 Organisation: Supermarché Central';
  RAISE NOTICE '🏪 Magasin: Magasin Central Paris 15';
END $$;