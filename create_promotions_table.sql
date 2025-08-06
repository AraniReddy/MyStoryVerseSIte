-- Create promotions table
CREATE TABLE promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  brand_name TEXT NOT NULL,
  promotion_url TEXT,
  video_duration INTEGER CHECK (video_duration <= 30),
  active BOOLEAN DEFAULT true,
  active_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active_to TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment for video duration constraint
COMMENT ON COLUMN promotions.video_duration IS 'Video duration in seconds, max 30 seconds';
COMMENT ON COLUMN promotions.promotion_url IS 'URL to redirect users after watching promotion';

-- Enable RLS
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Policy for viewing active promotions
CREATE POLICY "Anyone can view active promotions" ON promotions
  FOR SELECT USING (active = true AND active_to > NOW());

-- Policy for admin to manage promotions
CREATE POLICY "Admin can manage promotions" ON promotions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND user_type = 'Admin'
    )
  );
