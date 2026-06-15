-- Tâches traçables (Lot 1.4) — preuve d'exécution & validation manager.
-- Qui a réalisé la tâche (nom + matricule), quand (début/fin/durée), avec
-- quelle preuve (commentaire + photo), et validation par un responsable.

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ended_at timestamptz;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS duration_minutes integer;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_by_name text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_by_matricule text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completion_comment text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS proof_photo_url text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS validated_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS validated_by_name text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS validated_at timestamptz;

-- Journal des validations de tâches (traçabilité de la décision manager).
CREATE TABLE IF NOT EXISTS task_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  validated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  validator_name text,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_task_validations_org
  ON task_validations(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_validations_task
  ON task_validations(task_id);

ALTER TABLE task_validations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'task_validations' AND policyname = 'org_members_read_task_validations'
  ) THEN
    CREATE POLICY "org_members_read_task_validations" ON task_validations
      FOR SELECT USING (
        organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'task_validations' AND policyname = 'managers_insert_task_validations'
  ) THEN
    CREATE POLICY "managers_insert_task_validations" ON task_validations
      FOR INSERT WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM profiles
          WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
      );
  END IF;
END $$;
