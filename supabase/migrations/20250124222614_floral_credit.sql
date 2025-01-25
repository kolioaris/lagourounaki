/*
  # Fix user signup trigger

  1. Changes
    - Update handle_new_user() trigger function to include default values for required fields
    - Add default values for name and bio to meet the NOT NULL and length constraints
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    name,
    bio
  )
  VALUES (
    new.id,
    new.email,
    'User_' || substring(new.id::text from 1 for 8),
    'Welcome to my profile! I''m new here and excited to join the community.'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;