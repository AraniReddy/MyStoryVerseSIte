-- Add SELECT policy for brand_tasks table
CREATE POLICY "Anyone can view tasks" ON brand_tasks
  FOR SELECT USING (true);