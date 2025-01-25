-- Posts Bucket Policies
CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'posts' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Anyone can view post images"
ON storage.objects FOR SELECT
USING (bucket_id = 'posts');

CREATE POLICY "Users can update their own post images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'posts' AND owner = auth.uid());

CREATE POLICY "Users can delete their own post images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'posts' AND owner = auth.uid());

-- Avatars Bucket Policies
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND owner = auth.uid());

CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND owner = auth.uid());