-- Enable RLS
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create user_profiles table
CREATE TABLE user_profiles (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')) NOT NULL,
  location TEXT NOT NULL,
  points_balance INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create brand_tasks table
CREATE TABLE brand_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_name TEXT NOT NULL,
  question TEXT NOT NULL,
  image_urls TEXT[] NOT NULL,
  reward_amount INTEGER NOT NULL,
  secure_mode BOOLEAN DEFAULT false,
  active_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active_to TIMESTAMP WITH TIME ZONE NOT NULL,
  feedback_url TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  reward_status TEXT CHECK (reward_status IN ('pending', 'paid')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, task_id)
);

-- Create wallet_transactions table
CREATE TABLE wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  task_id UUID REFERENCES brand_tasks(id),
  amount INTEGER NOT NULL,
  status TEXT CHECK (status IN ('pending', 'paid')) DEFAULT 'pending',
  payout_method TEXT DEFAULT 'UPI',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view and update own profile" ON user_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active tasks" ON brand_tasks
  FOR SELECT USING (active_to > NOW());

CREATE POLICY "Users can insert own responses" ON task_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own responses" ON task_responses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION update_points_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reward_status = 'paid' AND OLD.reward_status = 'pending' THEN
    UPDATE user_profiles 
    SET points_balance = points_balance + (
      SELECT reward_amount FROM brand_tasks WHERE id = NEW.task_id
    )
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update points when response is marked as paid
CREATE TRIGGER update_points_on_payment
  AFTER UPDATE ON task_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_points_balance();