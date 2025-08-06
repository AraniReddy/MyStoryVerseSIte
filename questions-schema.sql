-- Create questions table for quiz functionality
CREATE TABLE task_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES brand_tasks(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of options: ["Option 1", "Option 2", "Option 3", "Option 4"]
  correct_answer INTEGER NOT NULL CHECK (correct_answer >= 0 AND correct_answer <= 3),
  question_order INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user question responses table
CREATE TABLE user_question_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  task_id UUID REFERENCES brand_tasks(id) NOT NULL,
  question_id UUID REFERENCES task_questions(id) NOT NULL,
  selected_answer INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- Add RLS policies
ALTER TABLE task_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_question_responses ENABLE ROW LEVEL SECURITY;

-- Anyone can view questions
CREATE POLICY "Anyone can view questions" ON task_questions
  FOR SELECT USING (true);

-- Admin can insert questions
CREATE POLICY "Admin can insert questions" ON task_questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND user_type = 'Admin'
    )
  );

-- Users can insert own responses
CREATE POLICY "Users can insert own responses" ON user_question_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view own responses
CREATE POLICY "Users can view own responses" ON user_question_responses
  FOR SELECT USING (auth.uid() = user_id);