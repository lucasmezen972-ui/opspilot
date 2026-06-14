-- Allow managers and admins to read all training progress in their organisation.
-- Filtered via the trainings table which carries the organization_id.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_training_progress'
      AND policyname = 'managers_read_org_progress'
  ) THEN
    CREATE POLICY "managers_read_org_progress" ON user_training_progress
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'manager')
            AND training_id IN (
              SELECT id FROM trainings
              WHERE organization_id = p.organization_id
            )
        )
      );
  END IF;
END $$;

-- Allow managers and admins to read all profiles in their organisation
-- (needed to list team members in the supervision view).
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
      AND policyname = 'managers_read_org_profiles'
  ) THEN
    CREATE POLICY "managers_read_org_profiles" ON profiles
      FOR SELECT USING (
        organization_id IN (
          SELECT organization_id FROM profiles self
          WHERE self.id = auth.uid()
            AND self.role IN ('admin', 'manager')
        )
      );
  END IF;
END $$;
