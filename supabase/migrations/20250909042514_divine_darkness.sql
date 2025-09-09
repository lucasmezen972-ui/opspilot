/*
  # Création utilisateur de démonstration OpsPilot

  1. Utilisateur authentification
    - Email: demo@opspilot.com
    - Password: demo123

  2. Profil utilisateur
    - Nom: Marie Dupont
    - Rôle: Manager
    - Organisation et magasin par défaut

  3. Données de démonstration
    - Profil avec statistiques réalistes
    - Organisation et magasin par défaut
*/

-- Insérer l'organisation par défaut si elle n'existe pas
INSERT INTO organizations (
  id,
  name,
  subscription_plan,
  max_users,
  max_stores
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Supermarché Central Demo',
  'pro',
  100,
  10
) ON CONFLICT (id) DO NOTHING;

-- Insérer le magasin par défaut si il n'existe pas
INSERT INTO stores (
  id,
  organization_id,
  name,
  address,
  city,
  postal_code,
  country
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'Magasin Central Paris',
  '123 Avenue des Champs-Élysées',
  'Paris',
  '75008',
  'France'
) ON CONFLICT (id) DO NOTHING;

-- Vérifier si l'utilisateur demo existe déjà
DO $$
DECLARE
  demo_user_id uuid;
BEGIN
  -- Chercher l'utilisateur existant
  SELECT id INTO demo_user_id
  FROM auth.users 
  WHERE email = 'demo@opspilot.com'
  LIMIT 1;

  -- Si pas trouvé, créer l'utilisateur
  IF demo_user_id IS NULL THEN
    -- Générer un ID pour l'utilisateur
    demo_user_id := gen_random_uuid();
    
    -- Insérer dans auth.users
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      demo_user_id,
      'demo@opspilot.com',
      crypt('demo123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
    
    RAISE NOTICE 'Utilisateur demo créé avec ID: %', demo_user_id;
  ELSE
    RAISE NOTICE 'Utilisateur demo existe déjà avec ID: %', demo_user_id;
  END IF;

  -- Créer ou mettre à jour le profil
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
    demo_user_id,
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
  ) ON CONFLICT (id) DO UPDATE SET
    organization_id = EXCLUDED.organization_id,
    store_id = EXCLUDED.store_id,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    level = EXCLUDED.level,
    xp = EXCLUDED.xp,
    total_audits = EXCLUDED.total_audits,
    avg_score = EXCLUDED.avg_score,
    completed_trainings = EXCLUDED.completed_trainings,
    active_time_hours = EXCLUDED.active_time_hours,
    updated_at = now();

  RAISE NOTICE 'Profil demo créé/mis à jour pour: %', demo_user_id;

END $$;

-- Message final
SELECT 
  '✅ UTILISATEUR DEMO CONFIGURÉ !' as status,
  'Email: demo@opspilot.com' as email,
  'Password: demo123' as password,
  'Vous pouvez maintenant vous connecter dans l''app' as instruction;