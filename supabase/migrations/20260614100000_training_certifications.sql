-- Lot 2.1 : formations quasi-certifiantes
-- Idempotent : toutes les opérations vérifient l'existence avant d'agir.

-- 1. Score minimum par formation (défaut 70 %)
ALTER TABLE trainings
  ADD COLUMN IF NOT EXISTS min_score integer NOT NULL DEFAULT 70
    CHECK (min_score BETWEEN 0 AND 100);

-- 2. Champs anti-triche sur les questions de quiz
ALTER TABLE training_quiz_questions
  ADD COLUMN IF NOT EXISTS difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')),
  ADD COLUMN IF NOT EXISTS question_type text CHECK (question_type IN (
    'qcm_single', 'qcm_multi', 'true_false',
    'situation', 'chronological', 'association', 'critical'
  )),
  ADD COLUMN IF NOT EXISTS is_critical boolean NOT NULL DEFAULT false;

-- 3. Table des certificats de formation
CREATE TABLE IF NOT EXISTS training_certificates (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  training_id         uuid NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  organization_id     uuid NOT NULL,
  full_name           text NOT NULL,
  training_title      text NOT NULL,
  score               integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  issued_at           timestamptz NOT NULL DEFAULT now(),
  expires_at          timestamptz,
  certificate_number  text NOT NULL UNIQUE,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Index pour les lookups courants
CREATE INDEX IF NOT EXISTS training_certificates_user_idx
  ON training_certificates (user_id);
CREATE INDEX IF NOT EXISTS training_certificates_training_idx
  ON training_certificates (training_id);
CREATE INDEX IF NOT EXISTS training_certificates_org_idx
  ON training_certificates (organization_id);

-- 4. RLS
ALTER TABLE training_certificates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Les utilisateurs voient leurs propres certificats et ceux de leur organisation
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'training_certificates'
      AND policyname = 'Users can read their own certificates'
  ) THEN
    CREATE POLICY "Users can read their own certificates"
      ON training_certificates FOR SELECT
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'training_certificates'
      AND policyname = 'Users can insert their own certificates'
  ) THEN
    CREATE POLICY "Users can insert their own certificates"
      ON training_certificates FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'training_certificates'
      AND policyname = 'Managers can read org certificates'
  ) THEN
    CREATE POLICY "Managers can read org certificates"
      ON training_certificates FOR SELECT
      USING (
        organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;
