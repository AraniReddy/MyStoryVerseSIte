-- Check if task_questions table exists
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'task_questions'
ORDER BY ordinal_position;