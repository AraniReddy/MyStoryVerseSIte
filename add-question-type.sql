-- Add question_type column to task_questions table
ALTER TABLE task_questions ADD COLUMN question_type TEXT DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'text_input'));