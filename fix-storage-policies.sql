-- Fix storage policies for media uploads

-- Media upload policy (Admin only)
CREATE POLICY "Admin can upload media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'media' AND 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND user_type = 'Admin'
    )
  );

-- Public read access for media
CREATE POLICY "Public read media" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

-- Brand tasks insert policy
CREATE POLICY "Admin can insert tasks" ON brand_tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND user_type = 'Admin'
    )
  );