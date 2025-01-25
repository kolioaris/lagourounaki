/*
  # Add required fields constraints

  1. Changes
    - Make name and bio required fields in profiles table
    - Add NOT NULL constraints
    - Add validation for minimum length

  2. Security
    - No changes to RLS policies needed
*/

-- Add NOT NULL constraints and validation
ALTER TABLE profiles 
ALTER COLUMN name SET NOT NULL,
ALTER COLUMN bio SET NOT NULL,
ADD CONSTRAINT name_min_length CHECK (length(trim(name)) >= 2),
ADD CONSTRAINT bio_min_length CHECK (length(trim(bio)) >= 10);