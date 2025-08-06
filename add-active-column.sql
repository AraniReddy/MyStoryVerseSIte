-- Add active column to brand_tasks table
ALTER TABLE brand_tasks ADD COLUMN active BOOLEAN DEFAULT true;

-- Update existing records to be active
UPDATE brand_tasks SET active = true WHERE active IS NULL;