/*
  Remove the remaining recursive policy on profiles.

  managers_read_org_profiles was created to let managers read every profile in
  their organization, but it queries profiles from a profiles policy. That makes
  even a simple self-profile read fail with SQLSTATE 42P17.
*/

DROP POLICY IF EXISTS "managers_read_org_profiles" ON public.profiles;
