/*
  # Fix mutual followers functionality

  1. Changes
    - Add get_mutual_followers function
    - Fix single row selection issue for followers

  2. New Functions
    - get_mutual_followers: Returns an array of user IDs that are mutual followers
*/

-- Function to get mutual followers
CREATE OR REPLACE FUNCTION get_mutual_followers(user_id uuid)
RETURNS TABLE (mutual_follower_id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT f1.follower_id
  FROM followers f1
  JOIN followers f2 ON f1.follower_id = f2.following_id 
    AND f1.following_id = f2.follower_id
  WHERE f1.following_id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Fix the are_mutual_followers function to handle self-references
CREATE OR REPLACE FUNCTION are_mutual_followers(user1_id uuid, user2_id uuid)
RETURNS boolean AS $$
BEGIN
  -- If checking against self, return false
  IF user1_id = user2_id THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM followers f1
    JOIN followers f2 ON f1.follower_id = f2.following_id 
      AND f1.following_id = f2.follower_id
    WHERE f1.follower_id = user1_id AND f1.following_id = user2_id
  );
END;
$$ LANGUAGE plpgsql;