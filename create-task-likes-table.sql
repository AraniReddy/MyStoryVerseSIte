-- Create task_likes table to store user likes/unlikes
CREATE TABLE task_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  task_id UUID REFERENCES brand_tasks(id) NOT NULL,
  liked BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, task_id)
);

-- Add RLS policy
ALTER TABLE task_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own likes" ON task_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own likes" ON task_likes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own likes" ON task_likes
  FOR UPDATE USING (auth.uid() = user_id);