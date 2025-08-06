-- Check RLS status and policies for brand_tasks
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'brand_tasks';

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'brand_tasks';