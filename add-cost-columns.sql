-- Add cost columns to brand_tasks table
ALTER TABLE brand_tasks ADD COLUMN like_cost INTEGER DEFAULT 0;
ALTER TABLE brand_tasks ADD COLUMN comment_cost INTEGER DEFAULT 0;
ALTER TABLE brand_tasks ADD COLUMN feedback_cost INTEGER DEFAULT 0;