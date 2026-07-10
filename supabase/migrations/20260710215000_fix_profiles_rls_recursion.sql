/*
  Fix profiles RLS recursion in production.

  The manager/admin UI cannot load when Supabase raises:
  "infinite recursion detected in policy for relation profiles".
  Recreate the organization helper and the SELECT policy with a fresh
  migration name so GitHub Actions applies the fix even if an older
  hardening migration was already marked as applied.
*/

CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.current_org_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_org_id() TO authenticated;

DROP POLICY IF EXISTS "profiles_select_org" ON public.profiles;

CREATE POLICY "profiles_select_org" ON public.profiles
FOR SELECT TO public
USING (
  id = auth.uid()
  OR organization_id = public.current_org_id()
);
