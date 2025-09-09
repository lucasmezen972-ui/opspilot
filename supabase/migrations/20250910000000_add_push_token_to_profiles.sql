-- Adds push notification token storage
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token text;
CREATE INDEX IF NOT EXISTS idx_profiles_push_token ON profiles(push_token);
