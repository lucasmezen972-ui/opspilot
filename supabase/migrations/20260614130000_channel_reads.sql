-- Accusés de lecture par canal (Lot 2.5 — suivi des non-lus)
-- Modèle « last_read_at » par (utilisateur, canal) : plus efficace et
-- persistant que le tableau read_by par message. Chaque membre gère ses
-- propres marqueurs de lecture.

CREATE TABLE IF NOT EXISTS channel_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_channel_reads_user ON channel_reads(user_id);

ALTER TABLE channel_reads ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'channel_reads' AND policyname = 'users_manage_own_reads'
  ) THEN
    CREATE POLICY "users_manage_own_reads" ON channel_reads
      FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
