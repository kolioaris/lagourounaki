/*
  # Add team members and seen posts tracking

  1. New Tables
    - `team_members`
      - `user_id` (uuid, references profiles.id)
      - `team_leader_id` (uuid, references profiles.id)
      - `created_at` (timestamp)
    - `seen_posts`
      - `user_id` (uuid, references profiles.id)
      - `post_id` (uuid, references posts.id)
      - `seen_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS team_members (
  user_id uuid REFERENCES profiles(id) NOT NULL,
  team_leader_id uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, team_leader_id)
);

CREATE TABLE IF NOT EXISTS seen_posts (
  user_id uuid REFERENCES profiles(id) NOT NULL,
  post_id uuid REFERENCES posts(id) NOT NULL,
  seen_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE seen_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their team members"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (auth.uid() = team_leader_id);

CREATE POLICY "Users can manage their team members"
  ON team_members
  FOR ALL
  TO authenticated
  USING (auth.uid() = team_leader_id);

CREATE POLICY "Users can track their seen posts"
  ON seen_posts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);