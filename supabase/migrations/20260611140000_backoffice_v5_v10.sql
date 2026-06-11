/*
  Back-office v5→v10 (appliqué sur V2) : annonces in-app, journal d'emails,
  réglages plateforme, rôle « support » (lecture seule back-office).
  Idempotent.
*/

DO $$
begin
  if exists (select 1 from pg_constraint where conname = 'profiles_role_check') then
    alter table public.profiles drop constraint profiles_role_check;
  end if;
end $$;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role = ANY (ARRAY['superadmin'::text, 'support'::text, 'admin'::text,
                           'manager'::text, 'employé'::text, 'employee'::text,
                           'stagiaire'::text]));

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  level text NOT NULL DEFAULT 'info'
    CHECK (level IN ('info', 'warning', 'success')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS announcements_select ON public.announcements;
CREATE POLICY announcements_select ON public.announcements
  FOR SELECT TO authenticated
  USING (
    is_active
    AND starts_at <= now()
    AND (ends_at IS NULL OR ends_at > now())
    AND (
      organization_id IS NULL
      OR organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE TABLE IF NOT EXISTS public.email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid,
  recipient text NOT NULL,
  template text NOT NULL,
  status text NOT NULL,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS email_log_template_org_idx
  ON public.email_log (template, organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Page Santé du back-office : statut des crons + taille de la base.
-- SECURITY DEFINER, EXECUTE réservé à service_role (via révocation public).

CREATE OR REPLACE FUNCTION public.admin_cron_status()
RETURNS TABLE(
  jobname text,
  status text,
  return_message text,
  start_time timestamptz,
  end_time timestamptz
)
LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
  SELECT j.jobname::text, d.status::text, d.return_message::text,
         d.start_time, d.end_time
  FROM cron.job j
  JOIN LATERAL (
    SELECT * FROM cron.job_run_details d
    WHERE d.jobid = j.jobid
    ORDER BY d.end_time DESC NULLS LAST
    LIMIT 3
  ) d ON true
  ORDER BY j.jobname, d.end_time DESC;
$$;

CREATE OR REPLACE FUNCTION public.admin_db_size()
RETURNS text
LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
  SELECT pg_size_pretty(pg_database_size(current_database()));
$$;

REVOKE EXECUTE ON FUNCTION public.admin_cron_status() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_db_size() FROM public, anon, authenticated;
