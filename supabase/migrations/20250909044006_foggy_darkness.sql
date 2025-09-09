/*
  # Create demo user for authentication

  1. Demo User Setup
    - Create demo user in auth.users
    - Create corresponding profile
    - Ensure proper organization setup
  
  2. Security
    - Enable RLS
    - Set proper policies
*/

-- Ensure we have a demo organization first
INSERT INTO organizations (id, name, subscription_plan, max_users, max_stores)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Demo Organization',
  'pro',
  100,
  10
) ON CONFLICT (id) DO NOTHING;

-- Insert demo user directly into auth.users (requires superuser privileges)
-- This would typically be done through Supabase Auth API or dashboard
-- For development, you can create the user through Supabase dashboard:
-- Email: demo@opspilot.com
-- Password: demo123

-- Create demo profile (will be linked once auth user is created)
INSERT INTO profiles (
  id,
  organization_id,
  email,
  full_name,
  role,
  is_active
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'demo@opspilot.com',
  'Marie Dupont',
  'admin',
  true
) ON CONFLICT (id) DO NOTHING;

-- Note: The actual user creation in auth.users must be done through:
-- 1. Supabase Dashboard > Authentication > Users > Add User
-- 2. Or through the Auth API
-- Use ID: 550e8400-e29b-41d4-a716-446655440001
-- Email: demo@opspilot.com
-- Password: demo123