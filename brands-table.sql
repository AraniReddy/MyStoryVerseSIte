-- Create brands table
CREATE TABLE brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  tier TEXT CHECK (tier IN ('premium', 'mid-tier', 'regular')) DEFAULT 'regular',
  weight INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample brands
INSERT INTO brands (name, tier, weight) VALUES
('Apple', 'premium', 5),
('Nike', 'premium', 5),
('Samsung', 'premium', 5),
('Google', 'premium', 5),
('Xiaomi', 'mid-tier', 3),
('OnePlus', 'mid-tier', 3),
('Adidas', 'mid-tier', 3),
('Puma', 'mid-tier', 3),
('Zara', 'regular', 1),
('H&M', 'regular', 1);

-- Update brand_tasks table to reference brands
ALTER TABLE brand_tasks ADD COLUMN brand_id UUID REFERENCES brands(id);

-- Enable RLS on brands table
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- RLS Policy for brands
CREATE POLICY "Anyone can view active brands" ON brands
  FOR SELECT USING (active = true);