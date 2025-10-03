import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'public' | 'admin';
  google_id: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ReliefPin = {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  location_name: string;
  relief_type: 'food' | 'medical' | 'shelter' | 'water' | 'clothing' | 'other';
  description: string;
  photo_url: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  is_active: boolean;
  start_datetime: string | null;
  end_datetime: string | null;
  created_at: string;
  updated_at: string;
  user_profile?: UserProfile;
};
