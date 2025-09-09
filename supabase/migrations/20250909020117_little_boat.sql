/*
  # Correction utilisateur démo - Gestion des doublons

  1. Mise à jour de l'utilisateur existant
  2. Création du profil s'il n'existe pas
  3. Insertion des données de démo
*/

-- Mettre à jour l'utilisateur existant au lieu d'en créer un nouveau
UPDATE users 
SET updated_at = now()
WHERE email = 'demo@opspilot.com';

-- Créer l'organisation si elle n'existe pas
INSERT INTO organizations (
  id, name, subscription_plan, max_users, max_stores
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Supermarché Central Demo',
  'pro',
  100,
  10
) ON CONFLICT (id) DO NOTHING;

-- Créer le magasin si il n'existe pas
INSERT INTO stores (
  id, organization_id, name, address, city, postal_code, country, is_active
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'Magasin Principal',
  '123 Rue du Commerce',
  'Paris',
  '75001',
  'France',
  true
) ON CONFLICT (id) DO NOTHING;

-- Créer le département si il n'existe pas
INSERT INTO departments (
  id, organization_id, store_id, name, description
) VALUES (
  '550e8400-e29b-41d4-a716-446655440002'::uuid,
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'Direction',
  'Direction générale du magasin'
) ON CONFLICT (store_id, lower(name)) DO NOTHING;

-- Obtenir l'ID de l'utilisateur existant
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Récupérer l'ID de l'utilisateur demo
    SELECT id INTO user_uuid FROM users WHERE email = 'demo@opspilot.com';
    
    IF user_uuid IS NOT NULL THEN
        -- Créer ou mettre à jour le profil
        INSERT INTO profiles (
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
            user_uuid,
            '550e8400-e29b-41d4-a716-446655440000'::uuid,
            '550e8400-e29b-41d4-a716-446655440001'::uuid,
            'demo@opspilot.com',
            'Utilisateur Démo',
            'admin',
            '550e8400-e29b-41d4-a716-446655440002'::uuid,
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
            department_id = EXCLUDED.department_id,
            level = EXCLUDED.level,
            xp = EXCLUDED.xp,
            total_audits = EXCLUDED.total_audits,
            avg_score = EXCLUDED.avg_score,
            completed_trainings = EXCLUDED.completed_trainings,
            active_time_hours = EXCLUDED.active_time_hours,
            is_active = EXCLUDED.is_active,
            updated_at = now();
            
        RAISE NOTICE '✅ Profil utilisateur démo mis à jour avec ID: %', user_uuid;
    ELSE
        RAISE NOTICE '❌ Utilisateur demo@opspilot.com non trouvé';
    END IF;
END $$;

-- Insérer quelques données de démo (avec ON CONFLICT pour éviter les doublons)
INSERT INTO audit_templates (organization_id, name, description, category, estimated_duration, max_score, is_active)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000'::uuid, 'Contrôle Rayon Frais', 'Audit quotidien du rayon produits frais', 'Qualité', 20, 100, true),
  ('550e8400-e29b-41d4-a716-446655440000'::uuid, 'Audit Sécurité', 'Contrôle des mesures de sécurité', 'Sécurité', 30, 100, true)
ON CONFLICT DO NOTHING;

INSERT INTO trainings (organization_id, title, content, category, difficulty, duration_minutes, xp_reward, is_active)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000'::uuid, 'Accueil Client Excellence', 'Formation sur les techniques d''accueil client', 'Service Client', 'beginner', 25, 50, true),
  ('550e8400-e29b-41d4-a716-446655440000'::uuid, 'Hygiène Alimentaire HACCP', 'Formation obligatoire sur l''hygiène alimentaire', 'Hygiène', 'intermediate', 45, 100, true)
ON CONFLICT DO NOTHING;

NOTIFY pgrst, 'reload schema';

SELECT '🎉 UTILISATEUR DÉMO MIS À JOUR AVEC SUCCÈS !' as result;