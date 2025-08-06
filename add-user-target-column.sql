-- Add user_target column to brand_tasks table
ALTER TABLE brand_tasks ADD COLUMN user_target INTEGER DEFAULT 100;