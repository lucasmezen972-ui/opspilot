-- Revoke anon execution on superadmin-only SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.is_backoffice_operator() FROM anon;
REVOKE EXECUTE ON FUNCTION public.superadmin_organizations() FROM anon;

-- admin_audit_log: superadmin/support read-only, no direct client insert
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='admin_audit_log' AND policyname='superadmin_read_admin_audit_log') THEN
    CREATE POLICY "superadmin_read_admin_audit_log" ON public.admin_audit_log
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = (SELECT auth.uid())
          AND profiles.role IN ('superadmin', 'support')
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='admin_audit_log' AND policyname='service_insert_admin_audit_log') THEN
    CREATE POLICY "service_insert_admin_audit_log" ON public.admin_audit_log
      FOR INSERT WITH CHECK (false);
  END IF;
END $$;

-- ai_rate_limits: managed by edge function (service_role bypasses RLS)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ai_rate_limits' AND policyname='no_client_access_rate_limits') THEN
    CREATE POLICY "no_client_access_rate_limits" ON public.ai_rate_limits
      FOR ALL USING (false);
  END IF;
END $$;

-- email_log: superadmin/support read-only
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='email_log' AND policyname='superadmin_read_email_log') THEN
    CREATE POLICY "superadmin_read_email_log" ON public.email_log
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = (SELECT auth.uid())
          AND profiles.role IN ('superadmin', 'support')
        )
      );
  END IF;
END $$;

-- platform_settings: all authenticated users can read, superadmin can write
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='platform_settings' AND policyname='authenticated_read_platform_settings') THEN
    CREATE POLICY "authenticated_read_platform_settings" ON public.platform_settings
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='platform_settings' AND policyname='superadmin_insert_platform_settings') THEN
    CREATE POLICY "superadmin_insert_platform_settings" ON public.platform_settings
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = (SELECT auth.uid())
          AND profiles.role = 'superadmin'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='platform_settings' AND policyname='superadmin_update_platform_settings') THEN
    CREATE POLICY "superadmin_update_platform_settings" ON public.platform_settings
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = (SELECT auth.uid())
          AND profiles.role = 'superadmin'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='platform_settings' AND policyname='superadmin_delete_platform_settings') THEN
    CREATE POLICY "superadmin_delete_platform_settings" ON public.platform_settings
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = (SELECT auth.uid())
          AND profiles.role = 'superadmin'
        )
      );
  END IF;
END $$;
