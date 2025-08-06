-- Add new fields to brand_tasks table
ALTER TABLE brand_tasks ADD COLUMN feedback_type TEXT DEFAULT 'URL' CHECK (feedback_type IN ('URL', 'Questions'));
ALTER TABLE brand_tasks ADD COLUMN feedback_summary TEXT;
ALTER TABLE brand_tasks ADD COLUMN questions JSONB;