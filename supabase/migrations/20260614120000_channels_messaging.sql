-- Messagerie officielle par canaux (Lot 2.5)

CREATE TABLE IF NOT EXISTS channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'general'
    CHECK (type IN ('general', 'store', 'department', 'announcement')),
  is_archived boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS channel_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_name text NOT NULL,
  sender_role text,
  content text NOT NULL,
  message_type text NOT NULL DEFAULT 'text'
    CHECK (message_type IN ('text', 'announcement', 'link')),
  is_pinned boolean NOT NULL DEFAULT false,
  attachment_url text,
  read_by text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_channels_org ON channels(organization_id);
CREATE INDEX IF NOT EXISTS idx_channel_messages_channel ON channel_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_messages_created ON channel_messages(created_at);

-- RLS
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'channels' AND policyname = 'org_members_read_channels'
  ) THEN
    CREATE POLICY "org_members_read_channels" ON channels
      FOR SELECT USING (
        organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'channels' AND policyname = 'managers_manage_channels'
  ) THEN
    CREATE POLICY "managers_manage_channels" ON channels
      FOR ALL USING (
        organization_id IN (
          SELECT organization_id FROM profiles
          WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'channel_messages' AND policyname = 'org_members_read_messages'
  ) THEN
    CREATE POLICY "org_members_read_messages" ON channel_messages
      FOR SELECT USING (
        channel_id IN (
          SELECT id FROM channels WHERE organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
          )
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'channel_messages' AND policyname = 'members_insert_messages'
  ) THEN
    CREATE POLICY "members_insert_messages" ON channel_messages
      FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND channel_id IN (
          SELECT id FROM channels WHERE organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
          )
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'channel_messages' AND policyname = 'managers_moderate_messages'
  ) THEN
    CREATE POLICY "managers_moderate_messages" ON channel_messages
      FOR ALL USING (
        channel_id IN (
          SELECT c.id FROM channels c
          JOIN profiles p ON p.organization_id = c.organization_id
          WHERE p.id = auth.uid() AND p.role IN ('admin', 'manager')
        )
      );
  END IF;
END $$;
