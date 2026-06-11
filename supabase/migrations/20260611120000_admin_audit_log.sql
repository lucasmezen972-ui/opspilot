/*
  Journal des actions du back-office superadmin (appliqué sur V2).
  RLS activée SANS policy : lisible/inscriptible uniquement via service_role
  (Edge Function admin-api). Idempotent.
*/

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  target jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS admin_audit_log_created_idx
  ON public.admin_audit_log (created_at DESC);
