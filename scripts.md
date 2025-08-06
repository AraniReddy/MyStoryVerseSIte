# SecretShop - Database Scripts

## Required SQL Scripts

### 1. Add user_type column to user_profiles
```sql
ALTER TABLE user_profiles 
ADD COLUMN user_type TEXT DEFAULT 'User' 
CHECK (user_type IN ('User', 'Promotor', 'Admin'));
```

### 2. Add user_target column to brand_tasks
```sql
ALTER TABLE brand_tasks 
ADD COLUMN user_target INTEGER DEFAULT 100;
```

### 3. Add active column to brand_tasks
```sql
ALTER TABLE brand_tasks 
ADD COLUMN active BOOLEAN DEFAULT true;
```

### 4. Update admin access policy
```sql
-- Drop existing policy
DROP POLICY IF EXISTS "Users can select own profile" ON user_profiles;

-- Create new admin policy
CREATE POLICY "Admin can view all users" ON user_profiles
  FOR SELECT
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND user_type = 'Admin'
    )
  );
```

### 5. Create storage buckets
```sql
-- Create avatars bucket for profile pictures
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- Create media bucket for task images/videos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media', 'media', true);
```

### 6. Storage policies
```sql
-- Avatar upload policy
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Media upload policy (Admin only)
CREATE POLICY "Admin can upload media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'media' AND 
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND user_type = 'Admin'
    )
  );

-- Public read access
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id IN ('avatars', 'media'));
```

## Development Scripts

### Create sample admin user
```sql
-- First create user through Supabase Auth, then update profile
UPDATE user_profiles 
SET user_type = 'Admin' 
WHERE user_id = 'your-user-id-here';
```

### Sample brand data with weights
```sql
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
```

### Sample tasks with user_target
```sql
INSERT INTO brand_tasks (brand_name, question, image_urls, reward_amount, active_to, user_target, tags) VALUES
('Nike', 'What do you think about this new sneaker design?', 
 ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'], 
 25, NOW() + INTERVAL '30 days', 100, ARRAY['fashion', 'sneakers', 'sports']),
('Apple', 'Rate this iPhone case design', 
 ARRAY['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'], 
 30, NOW() + INTERVAL '30 days', 150, ARRAY['tech', 'accessories', 'mobile']);
```

## Maintenance Scripts

### Clean up expired tasks
```sql
UPDATE brand_tasks 
SET active = false 
WHERE active_to < NOW() AND active = true;
```

### User statistics query
```sql
SELECT 
  user_type,
  COUNT(*) as user_count,
  AVG(points_balance) as avg_points
FROM user_profiles 
GROUP BY user_type;
```

### Task completion statistics
```sql
SELECT 
  bt.brand_name,
  bt.user_target,
  COUNT(tr.id) as responses,
  ROUND((COUNT(tr.id)::float / bt.user_target) * 100, 2) as completion_percentage
FROM brand_tasks bt
LEFT JOIN task_responses tr ON bt.id = tr.task_id
WHERE bt.active = true
GROUP BY bt.id, bt.brand_name, bt.user_target
ORDER BY completion_percentage DESC;
```