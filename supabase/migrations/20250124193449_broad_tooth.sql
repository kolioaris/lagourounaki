/*
  # Add avatar support and unique name constraint

  1. Changes
    - Add avatar_url column to profiles table
    - Add unique constraint to name column in profiles table
    - Add check constraint to ensure name is not null when set

  2. Security
    - No changes to RLS policies needed
*/

-- Add avatar_url column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_url text;
  END IF;
END $$;

-- Add unique constraint to name column
-- First ensure any NULL names won't conflict
UPDATE profiles 
SET name = NULL 
WHERE name = '';

-- Add constraint to ensure name is unique when set
ALTER TABLE profiles 
ADD CONSTRAINT unique_name 
UNIQUE (name)
DEFERRABLE INITIALLY DEFERRED;

-- Add check constraint to ensure name is not empty when set
ALTER TABLE profiles 
ADD CONSTRAINT name_not_empty 
CHECK (name IS NULL OR length(trim(name)) > 0);