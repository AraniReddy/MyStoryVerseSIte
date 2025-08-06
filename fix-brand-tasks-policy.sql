-- Add missing RLS policy for brand_tasks table
CREATE POLICY "Admin can insert tasks" ON brand_tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND user_type = 'Admin'
    )
  );