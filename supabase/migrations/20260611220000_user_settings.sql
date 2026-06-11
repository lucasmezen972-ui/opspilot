-- Réglages utilisateur persistants et administration des noms d'organisation.
-- Migration idempotente pour OPS PILOT V2.

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL
    REFERENCES public.organizations(id) ON DELETE CASCADE,
  audit_notifications boolean NOT NULL DEFAULT true,
  action_notifications boolean NOT NULL DEFAULT true,
  training_notifications boolean NOT NULL DEFAULT true,
  weekly_summary boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_preferences_organization_idx
  ON public.user_preferences (organization_id);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_preferences_select_self
  ON public.user_preferences;
CREATE POLICY user_preferences_select_self
ON public.user_preferences
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  AND organization_id = public.current_org_id()
);

DROP POLICY IF EXISTS user_preferences_insert_self
  ON public.user_preferences;
CREATE POLICY user_preferences_insert_self
ON public.user_preferences
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND organization_id = public.current_org_id()
);

DROP POLICY IF EXISTS user_preferences_update_self
  ON public.user_preferences;
CREATE POLICY user_preferences_update_self
ON public.user_preferences
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND organization_id = public.current_org_id()
)
WITH CHECK (
  user_id = auth.uid()
  AND organization_id = public.current_org_id()
);

DROP POLICY IF EXISTS user_preferences_delete_self
  ON public.user_preferences;
CREATE POLICY user_preferences_delete_self
ON public.user_preferences
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  AND organization_id = public.current_org_id()
);

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.user_preferences TO authenticated;

DROP TRIGGER IF EXISTS set_updated_at ON public.user_preferences;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- L'ancienne politique FOR ALL autorisait chaque membre à renommer son
-- organisation. Les mises à jour sont maintenant réservées à l'admin.
DROP POLICY IF EXISTS "org_all_organizations"
  ON public.organizations;
DROP POLICY IF EXISTS org_update_organizations_admin
  ON public.organizations;
CREATE POLICY org_update_organizations_admin
ON public.organizations
FOR UPDATE
TO authenticated
USING (
  id = public.current_org_id()
  AND EXISTS (
    SELECT 1
    FROM public.profiles profile
    WHERE profile.id = auth.uid()
      AND profile.organization_id = organizations.id
      AND profile.role = 'admin'
  )
)
WITH CHECK (
  id = public.current_org_id()
  AND EXISTS (
    SELECT 1
    FROM public.profiles profile
    WHERE profile.id = auth.uid()
      AND profile.organization_id = organizations.id
      AND profile.role = 'admin'
  )
);

DROP POLICY IF EXISTS "org_update_stores"
  ON public.stores;
DROP POLICY IF EXISTS org_update_stores_admin
  ON public.stores;
CREATE POLICY org_update_stores_admin
ON public.stores
FOR UPDATE
TO authenticated
USING (
  organization_id = public.current_org_id()
  AND EXISTS (
    SELECT 1
    FROM public.profiles profile
    WHERE profile.id = auth.uid()
      AND profile.organization_id = stores.organization_id
      AND profile.role = 'admin'
  )
)
WITH CHECK (
  organization_id = public.current_org_id()
  AND EXISTS (
    SELECT 1
    FROM public.profiles profile
    WHERE profile.id = auth.uid()
      AND profile.organization_id = stores.organization_id
      AND profile.role = 'admin'
  )
);
