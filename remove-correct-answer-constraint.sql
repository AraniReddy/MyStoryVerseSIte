-- Remove correct answer check constraint and make columns nullable
ALTER TABLE task_questions DROP CONSTRAINT IF EXISTS task_questions_correct_answer_check;
ALTER TABLE task_questions ALTER COLUMN options DROP NOT NULL;
ALTER TABLE task_questions ALTER COLUMN correct_answer DROP NOT NULL;