/*
  # Configuration utilisateur démo sécurisée
  
  Ce script crée l'utilisateur démo pour l'application OpsPilot.
  À UTILISER UNIQUEMENT EN DÉVELOPPEMENT.
  
  1. Utilisateur auth
  2. Profil utilisateur 
  3. Organisation et magasin de test
  
  ATTENTION : Ne pas utiliser en production !
*/

-- Créer l'organisation de démonstration si elle n'existe pas
INSERT INTO organizations (
  id,
  name,
  subscription_plan,
  max_users,
  max_stores
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'SuperMarché Central Demo',
  'pro',
  100,
  10
) ON CONFLICT (id) DO NOTHING;

-- Créer le magasin de démonstration
INSERT INTO stores (
  id,
  organization_id,
  name,
  address,
  city,
  postal_code,
  country,
  is_active
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'Magasin Central Paris 15ème',
  '123 Avenue de la République',
  'Paris',
  '75015',
  'France',
  true
) ON CONFLICT (id) DO NOTHING;

-- Créer le profil utilisateur démo (après création auth)
-- Note: L'ID doit correspondre à l'utilisateur auth créé manuellement
DO $$
DECLARE
    demo_user_id uuid;
BEGIN
    -- Récupérer l'ID de l'utilisateur demo s'il existe
    SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@opspilot.com' LIMIT 1;
    
    -- Si l'utilisateur existe, créer/mettre à jour son profil
    IF demo_user_id IS NOT NULL THEN
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
            active_time_hours,
            is_active
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
            156,
            true
        ) ON CONFLICT (id) DO UPDATE SET
            organization_id = EXCLUDED.organization_id,
            store_id = EXCLUDED.store_id,
            full_name = EXCLUDED.full_name,
            role = EXCLUDED.role,
            level = EXCLUDED.level,
            xp = EXCLUDED.xp,
            updated_at = now();
            
        RAISE NOTICE 'Profil démo mis à jour pour l''utilisateur %', demo_user_id;
    ELSE
        RAISE NOTICE 'Utilisateur demo@opspilot.com non trouvé. Créez-le d''abord dans Authentication > Users';
    END IF;
END $$;