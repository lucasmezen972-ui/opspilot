/*
  Restore organization-level profile reads.

  Migration 20260710215500 restricted profiles SELECT to self-only
  (id = auth.uid()) to break an infinite-recursion loop. That loop was
  caused by managers_read_org_profiles, which was subsequently dropped
  in 20260710220000. With the recursive policy gone, it is now safe to
  restore org-level reads using the current_org_id() SECURITY DEFINER
  helper (which reads profiles outside RLS, avoiding recursion).

  Without this, Team, Leaderboard, Training Supervision, and Manager
  cockpit all return only the current user instead of the full org roster.
*/

DROP POLICY IF EXISTS "profiles_select_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_org" ON public.profiles;

CREATE POLICY "profiles_select_org" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid() OR organization_id = public.current_org_id());
