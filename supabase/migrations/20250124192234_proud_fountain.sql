/*
  # Add Recent Searches Feature

  1. New Tables
    - `recent_searches`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `search_term` (text)
      - `search_type` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `recent_searches` table
    - Add policies for users to manage their own recent searches
*/

-- Create recent_searches table
CREATE TABLE IF NOT EXISTS recent_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  search_term text NOT NULL,
  search_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE recent_searches ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own recent searches"
  ON recent_searches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their recent searches"
  ON recent_searches FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);