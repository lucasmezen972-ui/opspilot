-- Revoke EXECUTE from anon on SECURITY DEFINER functions that should only be
-- callable by authenticated users. Fixes Supabase security advisor warnings.

REVOKE EXECUTE ON FUNCTION public.is_backoffice_operator() FROM anon;
REVOKE EXECUTE ON FUNCTION public.superadmin_organizations() FROM anon;
