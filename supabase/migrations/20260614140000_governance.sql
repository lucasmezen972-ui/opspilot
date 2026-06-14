-- Gouvernance & traçabilité (Lot 3.3)
-- Journal d'activité métier, conservation des preuves et journalisation des
-- accès/exports. L'application alimente ces tables ; la RLS garantit que chaque
-- organisation ne voit que ses propres traces.

CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_log_org ON activity_log(organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS evidence_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid,
  storage_path text NOT NULL,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_evidence_files_org ON evidence_files(organization_id);

CREATE TABLE IF NOT EXISTS evidence_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  evidence_id uuid REFERENCES evidence_files(id) ON DELETE CASCADE,
  accessed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_evidence_access_org ON evidence_access_log(organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS export_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  export_type text NOT NULL,
  format text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_export_log_org ON export_log(organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  document_id uuid NOT NULL,
  version integer NOT NULL DEFAULT 1,
  snapshot jsonb NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_document_versions_doc ON document_versions(document_type, document_id, version DESC);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

-- Helper : organisation de l'utilisateur courant.
-- Lecture réservée aux membres de l'organisation ; insertion par les membres.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'activity_log', 'evidence_files', 'evidence_access_log',
    'export_log', 'document_versions'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = 'org_members_read'
    ) THEN
      EXECUTE format(
        'CREATE POLICY "org_members_read" ON %I FOR SELECT USING (
           organization_id IN (
             SELECT organization_id FROM profiles WHERE id = auth.uid()
           )
         )', t);
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = 'org_members_insert'
    ) THEN
      EXECUTE format(
        'CREATE POLICY "org_members_insert" ON %I FOR INSERT WITH CHECK (
           organization_id IN (
             SELECT organization_id FROM profiles WHERE id = auth.uid()
           )
         )', t);
    END IF;
  END LOOP;
END $$;
