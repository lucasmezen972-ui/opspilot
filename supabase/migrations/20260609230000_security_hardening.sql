/*
  OpsPilot V2 — Durcissement sécurité (advisors Supabase)

  1. current_org_id() : helper SECURITY DEFINER pour les policies.
     Remplace la sous-requête auto-référencée de profiles_select_org,
     qui provoquait « infinite recursion detected in policy » dès qu'un
     utilisateur authentifié lisait la table profiles directement.
  2. Vues v_current_profile / v_is_admin / v_is_manager en security_invoker :
     les RLS s'appliquent désormais avec les droits de l'appelant.
  3. search_path fixé sur les fonctions signalées par le linter.
  4. EXECUTE révoqué pour anon/authenticated sur les fonctions internes
     (elles ne doivent pas être appelables via /rest/v1/rpc).

  Note : la protection « leaked password » (HaveIBeenPwned) se configure
  dans le dashboard Auth, pas en SQL.
*/

-- 1. Helper : organisation de l'utilisateur courant -------------------------

CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.current_org_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_org_id() TO authenticated;

DROP POLICY IF EXISTS "profiles_select_org" ON profiles;
CREATE POLICY "profiles_select_org" ON profiles FOR SELECT TO public
USING (id = auth.uid() OR organization_id = public.current_org_id());

-- 2. Vues en security_invoker ------------------------------------------------

ALTER VIEW public.v_current_profile SET (security_invoker = true);
ALTER VIEW public.v_is_admin SET (security_invoker = true);
ALTER VIEW public.v_is_manager SET (security_invoker = true);

-- 3. search_path immuable -----------------------------------------------------

ALTER FUNCTION public.enforce_org_quotas() SET search_path = public;
ALTER FUNCTION public.tg_set_updated_at() SET search_path = public;
ALTER FUNCTION public.insert_demo_data_safe() SET search_path = public;

-- 4. Fonctions internes : pas d'appel direct via l'API REST --------------------
-- Les triggers continuent de fonctionner : PostgreSQL ne revérifie pas le
-- droit EXECUTE de l'appelant au déclenchement d'un trigger.

REVOKE EXECUTE ON FUNCTION public.enforce_org_quotas() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.insert_demo_data_safe() FROM PUBLIC, anon, authenticated;
