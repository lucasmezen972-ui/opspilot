/*
  Unblock login/profile loading by removing recursive profile reads.

  The app only needs the signed-in user's profile to decide whether
  manager/admin tabs should be shown. Keep this policy deliberately simple:
  no helper function, no subquery back into profiles, no recursion.
*/

DROP POLICY IF EXISTS "profiles_select_org" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_self" ON public.profiles;

CREATE POLICY "profiles_select_self" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid());
