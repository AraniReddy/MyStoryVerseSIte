-- Add brand_id column to brand_tasks table
ALTER TABLE brand_tasks ADD COLUMN brand_id UUID REFERENCES brands(id);

-- Create index for better performance
CREATE INDEX idx_brand_tasks_brand_id ON brand_tasks(brand_id);