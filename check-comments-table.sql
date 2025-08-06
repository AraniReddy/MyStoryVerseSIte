-- Check if comments table exists
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'comments'
ORDER BY ordinal_position;