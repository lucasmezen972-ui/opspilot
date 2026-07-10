/*
  Reset the superadmin password for lucas.Mezen.972@gmail.com.

  Only the bcrypt hash is stored here, not the temporary plaintext password.
  The migration also ensures the existing auth user has a linked superadmin
  profile so the back-office can be opened after login.
*/

DO $$
DECLARE
  target_user_id uuid;
  target_email text := 'lucas.Mezen.972@gmail.com';
  default_org_id uuid := '550e8400-e29b-41d4-a716-446655440000';
BEGIN
  SELECT id
  INTO target_user_id
  FROM auth.users
  WHERE lower(email) = lower(target_email)
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Auth user not found for %', target_email
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.organizations (id, name, subscription_plan, max_users, max_stores)
  VALUES (default_org_id, 'OpsPilot', 'enterprise', 100, 10)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.users (id, email)
  VALUES (target_user_id, target_email)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();

  UPDATE auth.users
  SET
    encrypted_password = '$2a$10$BRk/8lm.FlZ3vyRigEhvpeQeNol1IWo7EB3Wjduw6dswFVVEgmUeW',
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
  WHERE id = target_user_id;

  INSERT INTO public.profiles (
    id,
    organization_id,
    email,
    full_name,
    role,
    is_active
  )
  VALUES (
    target_user_id,
    default_org_id,
    target_email,
    'Lucas Mezen',
    'superadmin',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    organization_id = COALESCE(public.profiles.organization_id, EXCLUDED.organization_id),
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    role = 'superadmin',
    is_active = true,
    updated_at = now();
END $$;
