-- OpsPilot demo seed
--
-- Prerequisite: create demo@opspilot.com in Supabase Auth before running this
-- file. The seed auto-detects the demo user's UUID from auth.users.
--
-- This seed is idempotent. Re-running it refreshes relative dates and keeps
-- the demo organization at exactly the expected level of useful sample data.

DO $$
DECLARE
  v_demo_uid uuid;
BEGIN
  SELECT id INTO v_demo_uid FROM auth.users WHERE email = 'demo@opspilot.com' LIMIT 1;
  IF v_demo_uid IS NULL THEN
    RAISE EXCEPTION
      'Create demo@opspilot.com in Supabase Auth before running supabase/seed.sql';
  END IF;
  PERFORM set_config('seed.demo_uid', v_demo_uid::text, true);
END
$$;

INSERT INTO organizations (
  id, name, subscription_plan, max_users, max_stores
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Supermarché Central Démo',
  'pro',
  50,
  5
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  subscription_plan = EXCLUDED.subscription_plan,
  max_users = EXCLUDED.max_users,
  max_stores = EXCLUDED.max_stores,
  updated_at = now();

INSERT INTO stores (
  id, organization_id, name, address, city, postal_code, country, is_active
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'Magasin Central Paris 15e',
  '123 avenue de la République',
  'Paris',
  '75015',
  'France',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  postal_code = EXCLUDED.postal_code,
  country = EXCLUDED.country,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO users (id, email)
VALUES (
  current_setting('seed.demo_uid')::uuid,
  'demo@opspilot.com'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = now();

INSERT INTO profiles (
  id, organization_id, store_id, email, full_name,
  role, level, xp, total_audits, avg_score,
  completed_trainings, active_time_hours, is_active
) VALUES (
  current_setting('seed.demo_uid')::uuid,
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440001',
  'demo@opspilot.com',
  'Marie Dupont',
  'manager',
  5, 420, 9, 87, 8, 156, true
)
ON CONFLICT (id) DO UPDATE SET
  organization_id = EXCLUDED.organization_id,
  store_id = EXCLUDED.store_id,
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  level = EXCLUDED.level,
  xp = EXCLUDED.xp,
  total_audits = EXCLUDED.total_audits,
  avg_score = EXCLUDED.avg_score,
  completed_trainings = EXCLUDED.completed_trainings,
  active_time_hours = EXCLUDED.active_time_hours,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO audits (
  id, organization_id, store_id, auditor_id,
  title, description, location, status, score, max_score, issues_count,
  started_at, completed_at, due_date, created_at, updated_at
) VALUES
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', current_setting('seed.demo_uid')::uuid, 'Contrôle hygiène rayon frais', 'Audit quotidien température et propreté', 'Rayon frais', 'completed', 92, 100, 1, now() - interval '1 day', now() - interval '1 day', now() - interval '1 day', now() - interval '1 day', now() - interval '1 day'),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', current_setting('seed.demo_uid')::uuid, 'Vérification chambre froide', 'Relevé des températures et contrôle des joints', 'Réserve', 'completed', 88, 100, 2, now() - interval '3 days', now() - interval '3 days', now() - interval '3 days', now() - interval '3 days', now() - interval '3 days'),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', current_setting('seed.demo_uid')::uuid, 'Audit DLC boulangerie', 'Contrôle des dates et de la rotation des stocks', 'Boulangerie', 'completed', 76, 100, 4, now() - interval '6 days', now() - interval '6 days', now() - interval '6 days', now() - interval '6 days', now() - interval '6 days'),
('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', current_setting('seed.demo_uid')::uuid, 'Contrôle affichage prix', 'Cohérence entre les étiquettes et la caisse', 'Surface de vente', 'in_progress', NULL, 100, 0, now() - interval '1 day', NULL, now() - interval '1 day', now() - interval '2 days', now() - interval '1 day'),
('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', current_setting('seed.demo_uid')::uuid, 'Audit sécurité incendie', 'Extincteurs, issues de secours et éclairage de sécurité', 'Tout le magasin', 'pending', NULL, 100, 0, NULL, NULL, now() + interval '2 days', now() - interval '5 days', now() - interval '5 days'),
('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', current_setting('seed.demo_uid')::uuid, 'Tournée propreté parking', 'Chariots, poubelles et signalétique', 'Extérieur', 'pending', NULL, 100, 0, NULL, NULL, now() + interval '2 days', now(), now()),
('650e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', current_setting('seed.demo_uid')::uuid, 'Contrôle réception marchandises', 'État des palettes, températures et bons de livraison', 'Quai de réception', 'completed', 95, 100, 0, now() - interval '8 days', now() - interval '8 days', now() - interval '8 days', now() - interval '8 days', now() - interval '8 days'),
('650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', current_setting('seed.demo_uid')::uuid, 'Audit fermeture magasin', 'Sécurisation des accès et extinction des équipements', 'Tout le magasin', 'completed', 84, 100, 2, now() - interval '10 days', now() - interval '10 days', now() - interval '10 days', now() - interval '10 days', now() - interval '10 days'),
('650e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', current_setting('seed.demo_uid')::uuid, 'Contrôle allergènes snacking', 'Affichage et séparation des préparations', 'Snacking', 'pending', NULL, 100, 0, NULL, NULL, now() + interval '1 day', now() - interval '1 day', now() - interval '1 day')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  location = EXCLUDED.location,
  status = EXCLUDED.status,
  score = EXCLUDED.score,
  max_score = EXCLUDED.max_score,
  issues_count = EXCLUDED.issues_count,
  started_at = EXCLUDED.started_at,
  completed_at = EXCLUDED.completed_at,
  due_date = EXCLUDED.due_date,
  updated_at = EXCLUDED.updated_at;

INSERT INTO products (
  id, organization_id, barcode, name, category, price,
  stock_quantity, min_stock, dlc, alert_threshold_days, added_by
) VALUES
('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '3000000000001', 'Yaourt nature x8', 'Crèmerie', 2.49, 24, 5, current_date + 1, 7, current_setting('seed.demo_uid')::uuid),
('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', '3000000000002', 'Jambon blanc 4 tranches', 'Charcuterie', 3.20, 8, 5, current_date - 1, 7, current_setting('seed.demo_uid')::uuid),
('750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', '3000000000003', 'Saumon fumé 120g', 'Marée', 6.90, 6, 5, current_date + 2, 7, current_setting('seed.demo_uid')::uuid),
('750e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', '3000000000004', 'Salade composée poulet', 'Snacking', 4.50, 12, 5, current_date, 7, current_setting('seed.demo_uid')::uuid),
('750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', '3000000000005', 'Lait demi-écrémé 1L', 'Crèmerie', 1.15, 60, 10, current_date + 12, 7, current_setting('seed.demo_uid')::uuid),
('750e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440000', '3000000000006', 'Beurre doux 250g', 'Crèmerie', 2.80, 30, 5, current_date + 20, 7, current_setting('seed.demo_uid')::uuid),
('750e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440000', '3000000000007', 'Steak haché 2x125g', 'Boucherie', 4.90, 14, 5, current_date + 3, 7, current_setting('seed.demo_uid')::uuid),
('750e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440000', '3000000000008', 'Pain de mie complet', 'Boulangerie', 1.90, 18, 5, current_date + 6, 7, current_setting('seed.demo_uid')::uuid),
('750e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440000', '3000000000009', 'Jus d''orange frais 1L', 'Frais', 2.95, 10, 5, current_date + 5, 7, current_setting('seed.demo_uid')::uuid),
('750e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', '3000000000010', 'Crème fraîche 30cl', 'Crèmerie', 1.75, 22, 5, current_date + 9, 7, current_setting('seed.demo_uid')::uuid),
('750e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440000', '3000000000011', 'Pizza margherita', 'Surgelés', 3.50, 16, 5, current_date + 120, 14, current_setting('seed.demo_uid')::uuid),
('750e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440000', '3000000000012', 'Eau minérale 6x1,5L', 'Boissons', 3.10, 45, 10, NULL, 7, current_setting('seed.demo_uid')::uuid),
('750e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440000', '3000000000013', 'Mozzarella 125g', 'Crèmerie', 1.35, 4, 6, current_date + 4, 7, current_setting('seed.demo_uid')::uuid),
('750e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440000', '3000000000014', 'Poulet rôti fermier', 'Rôtisserie', 9.90, 3, 5, current_date + 1, 3, current_setting('seed.demo_uid')::uuid),
('750e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440000', '3000000000015', 'Houmous 200g', 'Traiteur', 2.75, 9, 5, current_date + 2, 5, current_setting('seed.demo_uid')::uuid),
('750e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440000', '3000000000016', 'Fraises barquette 500g', 'Fruits & Légumes', 3.99, 15, 5, current_date + 3, 3, current_setting('seed.demo_uid')::uuid),
('750e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440000', '3000000000017', 'Dessert chocolat x4', 'Crèmerie', 2.30, 2, 5, current_date + 8, 7, current_setting('seed.demo_uid')::uuid)
ON CONFLICT ON CONSTRAINT uq_products_org_name DO UPDATE SET
  barcode = EXCLUDED.barcode,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  stock_quantity = EXCLUDED.stock_quantity,
  min_stock = EXCLUDED.min_stock,
  dlc = EXCLUDED.dlc,
  alert_threshold_days = EXCLUDED.alert_threshold_days,
  added_by = EXCLUDED.added_by,
  updated_at = now();

INSERT INTO corrective_actions (
  id, organization_id, store_id, audit_id,
  title, description, assignee_id, priority, status,
  due_date, resolved_at, created_by, created_at, updated_at
) VALUES
('850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440003', 'Retirer les produits à DLC dépassée', 'Retrait immédiat et traçabilité dans le registre', current_setting('seed.demo_uid')::uuid, 'critical', 'open', now(), NULL, current_setting('seed.demo_uid')::uuid, now() - interval '6 days', now() - interval '6 days'),
('850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440002', 'Remplacer le joint de la chambre froide n°2', 'Joint usé constaté pendant le contrôle', current_setting('seed.demo_uid')::uuid, 'high', 'in_progress', now() + interval '3 days', NULL, current_setting('seed.demo_uid')::uuid, now() - interval '3 days', now() - interval '1 day'),
('850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'Nettoyer la vitrine du rayon frais', 'Traces constatées côté client', current_setting('seed.demo_uid')::uuid, 'medium', 'open', now() + interval '2 days', NULL, current_setting('seed.demo_uid')::uuid, now() - interval '1 day', now() - interval '1 day'),
('850e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', NULL, 'Mettre à jour l''affichage des allergènes', 'Prendre en compte la nouvelle recette snacking', current_setting('seed.demo_uid')::uuid, 'low', 'done', now() - interval '2 days', now() - interval '2 days', current_setting('seed.demo_uid')::uuid, now() - interval '8 days', now() - interval '2 days'),
('850e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', NULL, 'Former l''équipe au nouveau plan de nettoyage', 'Session de 30 minutes avec support fourni', current_setting('seed.demo_uid')::uuid, 'medium', 'done', now() - interval '5 days', now() - interval '5 days', current_setting('seed.demo_uid')::uuid, now() - interval '10 days', now() - interval '5 days')
ON CONFLICT (id) DO UPDATE SET
  audit_id = EXCLUDED.audit_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  assignee_id = EXCLUDED.assignee_id,
  priority = EXCLUDED.priority,
  status = EXCLUDED.status,
  due_date = EXCLUDED.due_date,
  resolved_at = EXCLUDED.resolved_at,
  updated_at = EXCLUDED.updated_at;

DO $$
DECLARE
  audit_count integer;
  product_count integer;
  action_count integer;
BEGIN
  SELECT count(*) INTO audit_count
  FROM audits
  WHERE id::text LIKE '650e8400-e29b-41d4-a716-44665544000_';

  SELECT count(*) INTO product_count
  FROM products
  WHERE id::text LIKE '750e8400-e29b-41d4-a716-4466554400__';

  SELECT count(*) INTO action_count
  FROM corrective_actions
  WHERE id::text LIKE '850e8400-e29b-41d4-a716-44665544000_';

  RAISE NOTICE
    'OpsPilot demo seed ready: % audits, % products, % corrective actions',
    audit_count,
    product_count,
    action_count;
END
$$;
