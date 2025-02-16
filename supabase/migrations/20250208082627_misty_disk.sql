/*
  # Create reports table

  1. New Tables
    - `reports`
      - `id` (uuid, primary key)
      - `reporter_id` (uuid, references profiles)
      - `reported_id` (uuid, references profiles, nullable)
      - `post_id` (uuid, references posts, nullable)
      - `reason` (text)
      - `details` (text, nullable)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `reports` table
    - Add policies for authenticated users
*/

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

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);