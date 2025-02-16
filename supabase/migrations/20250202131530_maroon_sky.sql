-- Add blocked users table
CREATE TABLE IF NOT EXISTS blocked_users (
  blocker_id uuid REFERENCES profiles(id) NOT NULL,
  blocked_id uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);

-- Add group chats table
CREATE TABLE IF NOT EXISTS group_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon_url text,
  created_by uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add group chat members table
CREATE TABLE IF NOT EXISTS group_chat_members (
  group_id uuid REFERENCES group_chats(id) NOT NULL,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

-- Add group chat messages table
CREATE TABLE IF NOT EXISTS group_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES group_chats(id) NOT NULL,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES profiles(id) NOT NULL,
  reported_id uuid REFERENCES profiles(id),
  post_id uuid REFERENCES posts(id),
  reason text NOT NULL,
  details text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT report_target_check CHECK (
    (reported_id IS NOT NULL AND post_id IS NULL) OR
    (reported_id IS NULL AND post_id IS NOT NULL)
  )
);

-- Add bans table
CREATE TABLE IF NOT EXISTS bans (
  user_id uuid REFERENCES profiles(id) PRIMARY KEY,
  reason text NOT NULL,
  banned_at timestamptz DEFAULT now(),
  banned_by uuid REFERENCES profiles(id) NOT NULL
);

-- Add call logs table
CREATE TABLE IF NOT EXISTS call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id uuid REFERENCES profiles(id) NOT NULL,
  receiver_id uuid REFERENCES profiles(id) NOT NULL,
  call_type text NOT NULL CHECK (call_type IN ('voice', 'video')),
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  duration interval GENERATED ALWAYS AS (ended_at - started_at) STORED
);

-- Enable RLS
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their blocks"
  ON blocked_users FOR SELECT
  TO authenticated
  USING (auth.uid() IN (blocker_id, blocked_id));

CREATE POLICY "Users can manage their blocks"
  ON blocked_users FOR ALL
  TO authenticated
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can view group chats they're members of"
  ON group_chats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_chat_members
      WHERE group_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create group chats"
  ON group_chats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group members can view other members"
  ON group_chat_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_chat_members
      WHERE group_id = group_chat_members.group_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups they're invited to"
  ON group_chat_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_chat_members
      WHERE group_id = group_chat_members.group_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can view messages"
  ON group_chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_chat_members
      WHERE group_id = group_chat_messages.group_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can send messages"
  ON group_chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_chat_members
      WHERE group_id = group_chat_messages.group_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their reports"
  ON reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their call logs"
  ON call_logs FOR SELECT
  TO authenticated
  USING (auth.uid() IN (caller_id, receiver_id));

CREATE POLICY "Users can manage their call logs"
  ON call_logs FOR ALL
  TO authenticated
  USING (auth.uid() = caller_id);

-- Add function to handle blocking
CREATE OR REPLACE FUNCTION handle_block()
RETURNS trigger AS $$
BEGIN
  -- Remove any existing follows
  DELETE FROM followers
  WHERE (follower_id = NEW.blocker_id AND following_id = NEW.blocked_id)
     OR (follower_id = NEW.blocked_id AND following_id = NEW.blocker_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_block
  AFTER INSERT ON blocked_users
  FOR EACH ROW
  EXECUTE FUNCTION handle_block();

-- Modify posts table to support multiple attachments
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS edited_at timestamptz,
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Add function to check attachment size
CREATE OR REPLACE FUNCTION check_attachments_size()
RETURNS trigger AS $$
BEGIN
  IF (NEW.attachments IS NOT NULL AND 
      jsonb_array_length(NEW.attachments) > 0 AND
      (SELECT sum((attachment->>'size')::int) 
       FROM jsonb_array_elements(NEW.attachments) AS attachment) > 10485760)
  THEN
    RAISE EXCEPTION 'Total attachments size cannot exceed 10MB';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_attachments_size
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION check_attachments_size();

-- Add notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their notifications"
  ON notifications FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Modify profiles table
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS bio_min_length,
ALTER COLUMN bio DROP NOT NULL;