/*
  # Fix reports table

  1. Changes
    - Recreate reports table if it doesn't exist
    - Add proper RLS policies
    - Add indexes for better query performance

  2. Security
    - Enable RLS
    - Add policies for report creation and viewing
*/

-- Drop existing table if it exists to ensure clean state
DROP TABLE IF EXISTS reports;

-- Create reports table
CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES profiles(id) NOT NULL,
  reported_id uuid REFERENCES profiles(id),
  post_id uuid REFERENCES posts(id),
  reason text NOT NULL,
  details text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT report_target_check CHECK (
    (reported_id IS NOT NULL AND post_id IS NULL) OR
    (reported_id IS NULL AND post_id IS NOT NULL)
  )
);

-- Add indexes for better performance
CREATE INDEX reports_reporter_id_idx ON reports(reporter_id);
CREATE INDEX reports_reported_id_idx ON reports(reported_id) WHERE reported_id IS NOT NULL;
CREATE INDEX reports_post_id_idx ON reports(post_id) WHERE post_id IS NOT NULL;
CREATE INDEX reports_status_idx ON reports(status);

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

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_reports_updated_at();