export interface User {
  id: string;
  email?: string;
  phone?: string;
}

export interface UserProfile {
  user_id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  location: string;
  points_balance: number;
  profile_picture_url?: string;
  email?: string;
  date_of_birth?: string;
  user_type?: 'User' | 'Promotor' | 'Admin';
  interests?: string[];
  country?: string;
}

export interface BrandTask {
  id: string;
  brand_name: string;
  brand_id?: string;
  question: string;
  image_urls: string[];
  reward_amount: number;
  secure_mode: boolean;
  active_from: string;
  active_to: string;
  feedback_url?: string;
  tags?: string[];
  user_target?: number;
  like_cost?: number;
  comment_cost?: number;
  feedback_cost?: number;
  feedback_type?: string;
  feedback_summary?: string;
  questions?: any[];
}

export interface TaskResponse {
  id: string;
  user_id: string;
  task_id: string;
  liked: boolean;
  comment?: string;
  audio_url?: string;
  video_url?: string;
  created_at: string;
  reward_status: 'pending' | 'paid';
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  task_id?: string;
  promotion_id?: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'paid';
  payout_method: string;
  created_at: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  video_url: string;
  brand_name: string;
  promotion_url?: string;
  video_duration?: number;
  reward_view?: number;
  active: boolean;
  active_from: string;
  active_to: string;
  created_at: string;
}