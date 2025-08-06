-- SecretShop Complete Database Schema
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS wallet_transactions CASCADE;
DROP TABLE IF EXISTS task_responses CASCADE;
DROP TABLE IF EXISTS brand_tasks CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create user_profiles table
CREATE TABLE user_profiles (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')) NOT NULL,
  location TEXT NOT NULL,
  points_balance INTEGER DEFAULT 0,
  profile_picture_url TEXT,
  date_of_birth DATE,
  email TEXT,
  phone TEXT,
  interests TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create brand_tasks table
CREATE TABLE brand_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_name TEXT NOT NULL,
  question TEXT NOT NULL,
  image_urls TEXT[] NOT NULL,
  video_urls TEXT[],
  reward_amount INTEGER NOT NULL,
  secure_mode BOOLEAN DEFAULT false,
  active_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active_to TIMESTAMP WITH TIME ZONE NOT NULL,
  feedback_url TEXT,
  tags TEXT[],
  max_responses INTEGER DEFAULT 1000,
  current_responses INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_responses table
CREATE TABLE task_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  task_id UUID REFERENCES brand_tasks(id) NOT NULL,
  liked BOOLEAN NOT NULL,
  comment TEXT,
  audio_url TEXT,
  video_url TEXT,
  image_urls TEXT[],
  reward_status TEXT CHECK (reward_status IN ('pending', 'paid', 'rejected')) DEFAULT 'pending',
  quality_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, task_id)
);

-- Create wallet_transactions table
CREATE TABLE wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  task_id UUID REFERENCES brand_tasks(id),
  transaction_type TEXT CHECK (transaction_type IN ('earned', 'withdrawal', 'bonus', 'penalty')) NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')) DEFAULT 'pending',
  payout_method TEXT DEFAULT 'UPI',
  payout_details JSONB,
  description TEXT,
  reference_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('task', 'payment', 'system', 'promotion')) NOT NULL,
  read BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tags table
CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  emoji TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_tags junction table
CREATE TABLE task_tags (
  task_id UUID REFERENCES brand_tasks(id),
  tag_id UUID REFERENCES tags(id),
  PRIMARY KEY (task_id, tag_id)
);

-- Create user_sessions table for tracking
CREATE TABLE user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  device_info JSONB,
  ip_address INET,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leaderboard view
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  up.user_id,
  up.name,
  up.points_balance,
  COUNT(tr.id) as total_tasks,
  RANK() OVER (ORDER BY up.points_balance DESC) as rank
FROM user_profiles up
LEFT JOIN task_responses tr ON up.user_id = tr.user_id
GROUP BY up.user_id, up.name, up.points_balance
ORDER BY up.points_balance DESC;

-- Enable RLS on all tables (user_profiles disabled temporarily)
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can select own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for brand_tasks
CREATE POLICY "Anyone can view active tasks" ON brand_tasks
  FOR SELECT USING (active_to > NOW() AND current_responses < max_responses);

CREATE POLICY "Admins can manage tasks" ON brand_tasks
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for task_responses
CREATE POLICY "Users can insert own responses" ON task_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own responses" ON task_responses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own responses" ON task_responses
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for wallet_transactions
CREATE POLICY "Users can view own transactions" ON wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON wallet_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_points ON user_profiles(points_balance DESC);

CREATE INDEX idx_brand_tasks_active ON brand_tasks(active_to);
CREATE INDEX idx_brand_tasks_tags ON brand_tasks USING GIN(tags);
CREATE INDEX idx_brand_tasks_priority ON brand_tasks(priority DESC);

CREATE INDEX idx_task_responses_user_id ON task_responses(user_id);
CREATE INDEX idx_task_responses_task_id ON task_responses(task_id);
CREATE INDEX idx_task_responses_status ON task_responses(reward_status);
CREATE INDEX idx_task_responses_created ON task_responses(created_at DESC);

CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_type ON wallet_transactions(transaction_type);
CREATE INDEX idx_wallet_transactions_status ON wallet_transactions(status);
CREATE INDEX idx_wallet_transactions_created ON wallet_transactions(created_at DESC);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Functions and Triggers

-- Function to update points balance
CREATE OR REPLACE FUNCTION update_points_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reward_status = 'paid' AND OLD.reward_status = 'pending' THEN
    -- Add points to user balance
    UPDATE user_profiles 
    SET points_balance = points_balance + (
      SELECT reward_amount FROM brand_tasks WHERE id = NEW.task_id
    ),
    updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
    -- Create wallet transaction
    INSERT INTO wallet_transactions (user_id, task_id, transaction_type, amount, status, description)
    VALUES (
      NEW.user_id, 
      NEW.task_id, 
      'earned', 
      (SELECT reward_amount FROM brand_tasks WHERE id = NEW.task_id),
      'paid',
      'Task completion reward'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update task response count
CREATE OR REPLACE FUNCTION update_task_response_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE brand_tasks 
    SET current_responses = current_responses + 1,
        updated_at = NOW()
    WHERE id = NEW.task_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE brand_tasks 
    SET current_responses = current_responses - 1,
        updated_at = NOW()
    WHERE id = OLD.task_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_points_on_payment
  AFTER UPDATE ON task_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_points_balance();

CREATE TRIGGER update_task_count
  AFTER INSERT OR DELETE ON task_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_task_response_count();

-- Updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_tasks_updated_at
  BEFORE UPDATE ON brand_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_responses_updated_at
  BEFORE UPDATE ON task_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_transactions_updated_at
  BEFORE UPDATE ON wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sample Data Insertion
INSERT INTO user_profiles (user_id, name, age, gender, location, points_balance, email, date_of_birth) VALUES
('b5d15ec5-2f3a-4d12-93c4-f81a68bb471a', 'Dev User', 25, 'other', 'India', 1500, 'dev@secretshop.com', '1999-01-01'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Arjun Kumar', 28, 'male', 'Mumbai', 2450, 'arjun@example.com', '1996-03-15'),
('b2c3d4e5-f6g7-8901-bcde-f23456789012', 'Sneha Patel', 24, 'female', 'Delhi', 2180, 'sneha@example.com', '2000-07-22');

INSERT INTO brand_tasks (brand_name, question, image_urls, reward_amount, active_to, tags, secure_mode) VALUES
('Nike', 'What do you think about this new sneaker design?', 
 ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'], 
 25, NOW() + INTERVAL '30 days', ARRAY['fashion', 'sports', 'sneakers'], true),
('Apple', 'Rate this iPhone case design', 
 ARRAY['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'], 
 30, NOW() + INTERVAL '30 days', ARRAY['technology', 'mobile', 'accessories'], false),
('Samsung', 'How do you like these wireless earbuds?',
 ARRAY['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400'],
 20, NOW() + INTERVAL '25 days', ARRAY['technology', 'audio', 'accessories'], false),
('Adidas', 'Feedback on our new running shoes',
 ARRAY['https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=400'],
 22, NOW() + INTERVAL '20 days', ARRAY['fashion', 'sports', 'running'], true);

-- Sample wallet transactions
INSERT INTO wallet_transactions (user_id, transaction_type, amount, status, description) VALUES
('b5d15ec5-2f3a-4d12-93c4-f81a68bb471a', 'earned', 25, 'paid', 'Nike sneaker feedback'),
('b5d15ec5-2f3a-4d12-93c4-f81a68bb471a', 'earned', 30, 'paid', 'Apple iPhone case review'),
('b5d15ec5-2f3a-4d12-93c4-f81a68bb471a', 'withdrawal', -50, 'paid', 'UPI withdrawal'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'earned', 45, 'paid', 'Multiple task completion'),
('b2c3d4e5-f6g7-8901-bcde-f23456789012', 'earned', 35, 'paid', 'Samsung earbuds feedback');

-- Sample notifications
INSERT INTO notifications (user_id, title, message, type) VALUES
('b5d15ec5-2f3a-4d12-93c4-f81a68bb471a', 'New Task Available', 'Nike has a new sneaker design for review', 'task'),
('b5d15ec5-2f3a-4d12-93c4-f81a68bb471a', 'Payment Processed', 'Your reward of ₹25 has been credited', 'payment'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Congratulations!', 'You are now #1 on the leaderboard', 'system');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create admin role (optional)
-- INSERT INTO auth.users (id, email, role) VALUES ('admin-uuid', 'admin@secretshop.com', 'admin');

COMMENT ON TABLE user_profiles IS 'User profile information and points balance';
COMMENT ON TABLE brand_tasks IS 'Brand tasks/surveys for user feedback';
COMMENT ON TABLE task_responses IS 'User responses to brand tasks';
COMMENT ON TABLE wallet_transactions IS 'User wallet transactions and payments';
COMMENT ON TABLE notifications IS 'User notifications and alerts';
COMMENT ON TABLE user_sessions IS 'User session tracking for analytics';