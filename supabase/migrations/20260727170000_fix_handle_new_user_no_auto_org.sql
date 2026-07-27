-- Fix handle_new_user: stop auto-assigning the first org to new users.
-- New users get organization_id = NULL so the app shows the onboarding screen
-- where they create their own org or accept an invitation.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (
    id, email, full_name, role
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    'employé'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$function$;
