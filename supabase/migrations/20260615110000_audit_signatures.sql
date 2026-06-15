-- Signatures d'audit (Lot 1.1 — sign-off électronique).
-- Un audit clôturé peut être signé par l'auditeur et/ou un responsable :
-- preuve formelle d'exécution et de contrôle, horodatée et nominative.

CREATE TABLE IF NOT EXISTS audit_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  audit_id uuid NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  signer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  signer_name text NOT NULL,
  signer_role text NOT NULL CHECK (signer_role IN ('auditor', 'manager')),
  signed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (audit_id, signer_role)
);
CREATE INDEX IF NOT EXISTS idx_audit_signatures_audit
  ON audit_signatures(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_signatures_org
  ON audit_signatures(organization_id);

ALTER TABLE audit_signatures ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'audit_signatures' AND policyname = 'org_members_read_audit_signatures'
  ) THEN
    CREATE POLICY "org_members_read_audit_signatures" ON audit_signatures
      FOR SELECT USING (
        organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'audit_signatures' AND policyname = 'org_members_insert_audit_signatures'
  ) THEN
    CREATE POLICY "org_members_insert_audit_signatures" ON audit_signatures
      FOR INSERT WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;
