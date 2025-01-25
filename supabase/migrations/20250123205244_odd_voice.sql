/*
  # Add social features and admin functionality

  1. New Tables
    - `followers`: Track user followers
    - `messages`: Direct messaging between mutual followers
    - `comment_replies`: Nested comments
    - `comment_likes`: Track comment likes
    - `admin_team`: Website administrators
    - `post_shares`: Track post shares

  2. Changes
    - Add character limit to posts
    - Add message support
    - Add comment interactions
    - Add admin functionality

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies
*/

-- Create followers table
CREATE TABLE IF NOT EXISTS followers (
  follower_id uuid REFERENCES profiles(id) NOT NULL,
  following_id uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) NOT NULL,
  receiver_id uuid REFERENCES profiles(id) NOT NULL,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create comment_replies table
CREATE TABLE IF NOT EXISTS comment_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid REFERENCES comments(id) NOT NULL,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create comment_likes table
CREATE TABLE IF NOT EXISTS comment_likes (
  comment_id uuid REFERENCES comments(id) NOT NULL,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);

-- Create admin_team table
CREATE TABLE IF NOT EXISTS admin_team (
  user_id uuid REFERENCES profiles(id) NOT NULL PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('admin', 'moderator', 'developer')),
  created_at timestamptz DEFAULT now()
);

-- Create post_shares table
CREATE TABLE IF NOT EXISTS post_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) NOT NULL,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  shared_with_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;

-- Policies for followers
CREATE POLICY "Followers are viewable by everyone"
  ON followers FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their following"
  ON followers FOR ALL
  TO authenticated
  USING (auth.uid() = follower_id);

-- Policies for messages
CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() IN (sender_id, receiver_id));

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Policies for comment replies
CREATE POLICY "Comment replies are viewable by everyone"
  ON comment_replies FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their replies"
  ON comment_replies FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for comment likes
CREATE POLICY "Comment likes are viewable by everyone"
  ON comment_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their comment likes"
  ON comment_likes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for admin team
CREATE POLICY "Admin team is viewable by everyone"
  ON admin_team FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage admin team"
  ON admin_team FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_team
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policies for post shares
CREATE POLICY "Post shares are viewable by everyone"
  ON post_shares FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their shares"
  ON post_shares FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Add character limit trigger for posts
CREATE OR REPLACE FUNCTION check_post_content_length()
RETURNS trigger AS $$
BEGIN
  IF length(NEW.content) > 600 THEN
    RAISE EXCEPTION 'Post content cannot exceed 600 characters';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_post_content_length
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION check_post_content_length();

-- Function to check if users are mutual followers
CREATE OR REPLACE FUNCTION are_mutual_followers(user1_id uuid, user2_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM followers f1
    JOIN followers f2 ON f1.follower_id = f2.following_id 
      AND f1.following_id = f2.follower_id
    WHERE f1.follower_id = user1_id AND f1.following_id = user2_id
  );
END;
$$ LANGUAGE plpgsql;