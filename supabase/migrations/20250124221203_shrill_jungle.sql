/*
  # Add Advertisements Support
  
  1. New Tables
    - `advertisements`
      - `id` (uuid, primary key)
      - `content` (text, for ad content)
      - `image_url` (text, optional)
      - `external_url` (text, for the ad link)
      - `created_at` (timestamp)
      - `active` (boolean)
  
  2. Security
    - Enable RLS
    - Add policy for viewing active ads
*/

CREATE TABLE IF NOT EXISTS advertisements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  image_url text,
  external_url text,
  created_at timestamptz DEFAULT now(),
  active boolean DEFAULT true
);

ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active advertisements"
  ON advertisements
  FOR SELECT
  USING (active = true);