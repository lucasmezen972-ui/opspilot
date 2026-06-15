-- Structure & versionnage des modèles d'audit (Lot 1.1 — industrialisation).
-- Sections normalisées et versions de modèles : reproductibilité et audit
-- trail des référentiels de contrôle (un audit référence la version utilisée).

CREATE TABLE IF NOT EXISTS audit_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES audit_templates(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE (template_id, name)
);
CREATE INDEX IF NOT EXISTS idx_audit_sections_template
  ON audit_sections(template_id, sort_order);

CREATE TABLE IF NOT EXISTS audit_template_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES audit_templates(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  name text NOT NULL,
  item_count integer NOT NULL DEFAULT 0,
  snapshot jsonb NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, version)
);
CREATE INDEX IF NOT EXISTS idx_audit_template_versions_template
  ON audit_template_versions(template_id, version DESC);

-- L'audit conserve la version du modèle utilisée (reproductibilité).
ALTER TABLE audits ADD COLUMN IF NOT EXISTS template_version integer;

ALTER TABLE audit_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_template_versions ENABLE ROW LEVEL SECURITY;

-- Lecture par les membres de l'organisation ; écriture réservée aux managers.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['audit_sections', 'audit_template_versions'] LOOP
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
      SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = 'managers_write'
    ) THEN
      EXECUTE format(
        'CREATE POLICY "managers_write" ON %I FOR ALL USING (
           organization_id IN (
             SELECT organization_id FROM profiles
             WHERE id = auth.uid() AND role IN (''admin'', ''manager'')
           )
         )', t);
    END IF;
  END LOOP;
END $$;
