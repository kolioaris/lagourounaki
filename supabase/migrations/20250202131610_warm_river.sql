-- Add liked_posts table for the Liked page
CREATE TABLE IF NOT EXISTS liked_posts (
  user_id uuid REFERENCES profiles(id) NOT NULL,
  post_id uuid REFERENCES posts(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

-- Enable RLS
ALTER TABLE liked_posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their liked posts"
  ON liked_posts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their liked posts"
  ON liked_posts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Add function to handle post deletion
CREATE OR REPLACE FUNCTION handle_post_deletion()
RETURNS trigger AS $$
BEGIN
  -- Delete all attachments from storage
  PERFORM pg_notify('delete_attachments', 
    json_build_object(
      'bucket', 'posts',
      'paths', (SELECT array_agg(attachment->>'path')
                FROM jsonb_array_elements(OLD.attachments) attachment)
    )::text
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_post_deletion
  BEFORE DELETE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION handle_post_deletion();

-- Add email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id text PRIMARY KEY,
  subject text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default email templates
INSERT INTO email_templates (id, subject, content) VALUES
('reset_password', 'Reset Your Password', 'Click the button below to reset your password:'),
('welcome', 'Welcome to La Gourounaki', 'Welcome to La Gourounaki! We''re excited to have you join our community.');

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Create policy for email templates
CREATE POLICY "Email templates are viewable by everyone"
  ON email_templates FOR SELECT
  USING (true);