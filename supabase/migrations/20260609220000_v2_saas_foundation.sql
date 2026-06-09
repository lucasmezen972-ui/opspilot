/*
  OpsPilot V2 — Fondation SaaS

  1. corrective_actions : actions correctives générées depuis les non-conformités
  2. invitations : invitation d'utilisateurs par e-mail avec rôle pré-assigné
  3. subscriptions : abonnements Stripe par organisation
  4. activity_log : journal d'activité pour la conformité
  5. products : seuil d'alerte DLC
  6. Correctif : policy badges restreinte aux utilisateurs authentifiés
  7. Quotas : application de max_users / max_stores à l'insertion
*/

-- 1. Actions correctives ------------------------------------------------

CREATE TABLE IF NOT EXISTS corrective_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE SET NULL,
  audit_id uuid REFERENCES audits(id) ON DELETE SET NULL,
  audit_response_id uuid REFERENCES audit_responses(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  assignee_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  priority text NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'done', 'cancelled')),
  due_date timestamptz,
  resolved_at timestamptz,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_corrective_actions_org_status
  ON corrective_actions(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_assignee
  ON corrective_actions(assignee_id) WHERE status IN ('open', 'in_progress');

ALTER TABLE corrective_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select_corrective_actions" ON corrective_actions FOR SELECT TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));
CREATE POLICY "org_insert_corrective_actions" ON corrective_actions FOR INSERT TO public
WITH CHECK (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));
CREATE POLICY "org_update_corrective_actions" ON corrective_actions FOR UPDATE TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1))
WITH CHECK (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));
CREATE POLICY "org_delete_corrective_actions" ON corrective_actions FOR DELETE TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

-- 2. Invitations ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'employé'
    CHECK (role IN ('admin', 'manager', 'employé', 'stagiaire')),
  store_id uuid REFERENCES stores(id) ON DELETE SET NULL,
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  invited_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
  created_at timestamptz DEFAULT now(),

  CONSTRAINT uq_invitations_org_email_pending UNIQUE (organization_id, email)
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Seuls admins et managers gèrent les invitations de leur organisation
CREATE POLICY "mgr_select_invitations" ON invitations FOR SELECT TO public
USING (
  organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1)
  AND (SELECT role FROM v_current_profile LIMIT 1) IN ('admin', 'manager')
);
CREATE POLICY "mgr_insert_invitations" ON invitations FOR INSERT TO public
WITH CHECK (
  organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1)
  AND (SELECT role FROM v_current_profile LIMIT 1) IN ('admin', 'manager')
);
CREATE POLICY "mgr_update_invitations" ON invitations FOR UPDATE TO public
USING (
  organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1)
  AND (SELECT role FROM v_current_profile LIMIT 1) IN ('admin', 'manager')
)
WITH CHECK (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

-- 3. Abonnements Stripe --------------------------------------------------

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  plan text NOT NULL DEFAULT 'trial'
    CHECK (plan IN ('trial', 'essential', 'business', 'enterprise')),
  status text NOT NULL DEFAULT 'trialing'
    CHECK (status IN ('trialing', 'active', 'past_due', 'canceled')),
  trial_ends_at timestamptz DEFAULT now() + interval '14 days',
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Lecture pour toute l'organisation ; écriture réservée au service_role
-- (les webhooks Stripe passent par une Edge Function avec la clé service)
CREATE POLICY "org_select_subscriptions" ON subscriptions FOR SELECT TO public
USING (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

-- 4. Journal d'activité ---------------------------------------------------

CREATE TABLE IF NOT EXISTS activity_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_org_date
  ON activity_log(organization_id, created_at DESC);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select_activity_log" ON activity_log FOR SELECT TO public
USING (
  organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1)
  AND (SELECT role FROM v_current_profile LIMIT 1) IN ('admin', 'manager')
);
CREATE POLICY "org_insert_activity_log" ON activity_log FOR INSERT TO public
WITH CHECK (organization_id = (SELECT organization_id FROM v_current_profile LIMIT 1));

-- 5. DLC : seuil d'alerte par produit -------------------------------------

ALTER TABLE products ADD COLUMN IF NOT EXISTS alert_threshold_days integer DEFAULT 7
  CHECK (alert_threshold_days IS NULL OR alert_threshold_days >= 0);

CREATE INDEX IF NOT EXISTS idx_products_org_dlc
  ON products(organization_id, dlc) WHERE dlc IS NOT NULL;

-- 6. Correctif : badges lisibles uniquement par les utilisateurs connectés --

DROP POLICY IF EXISTS "badges_read_all" ON badges;
CREATE POLICY "badges_read_authenticated" ON badges FOR SELECT TO authenticated
USING (true);

-- 7. Quotas : application de max_users / max_stores -------------------------

CREATE OR REPLACE FUNCTION enforce_org_quotas()
RETURNS trigger AS $$
DECLARE
  quota integer;
  current_count integer;
BEGIN
  IF TG_TABLE_NAME = 'profiles' THEN
    SELECT max_users INTO quota FROM organizations WHERE id = NEW.organization_id;
    SELECT count(*) INTO current_count FROM profiles WHERE organization_id = NEW.organization_id;
    IF quota IS NOT NULL AND current_count >= quota THEN
      RAISE EXCEPTION 'Quota utilisateurs atteint (% max). Passez au plan supérieur.', quota
        USING ERRCODE = 'P0001';
    END IF;
  ELSIF TG_TABLE_NAME = 'stores' THEN
    SELECT max_stores INTO quota FROM organizations WHERE id = NEW.organization_id;
    SELECT count(*) INTO current_count FROM stores WHERE organization_id = NEW.organization_id;
    IF quota IS NOT NULL AND current_count >= quota THEN
      RAISE EXCEPTION 'Quota magasins atteint (% max). Passez au plan supérieur.', quota
        USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_quota_profiles ON profiles;
CREATE TRIGGER trg_quota_profiles
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION enforce_org_quotas();

DROP TRIGGER IF EXISTS trg_quota_stores ON stores;
CREATE TRIGGER trg_quota_stores
  BEFORE INSERT ON stores
  FOR EACH ROW EXECUTE FUNCTION enforce_org_quotas();
