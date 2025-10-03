/*
  # Earthquake Relief Tracking System - Database Schema

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `role` (text, enum: 'public' or 'admin')
      - `facebook_id` (text, optional)
      - `avatar_url` (text, optional)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `relief_pins`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `latitude` (numeric)
      - `longitude` (numeric)
      - `location_name` (text)
      - `relief_type` (text, e.g., food, medical, shelter, water)
      - `description` (text)
      - `photo_url` (text, optional)
      - `status` (text, enum: 'pending', 'approved', 'rejected')
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Public users can:
      - Read their own profile
      - Create relief pins (pending approval)
      - Read approved pins
      - Update their own pending pins
    - Admin users can:
      - Read all profiles
      - Manage all users (update roles, activate/deactivate)
      - Approve/reject/delete any pin
      - Full CRUD on all data

  3. Important Notes
    - First user with matching email will be set as admin (you'll need to configure this)
    - All pins start as 'pending' and require admin approval
    - Soft delete using is_active flag
    - Indexes on latitude/longitude for efficient geo queries
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'public' CHECK (role IN ('public', 'admin')),
  facebook_id text,
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create relief_pins table
CREATE TABLE IF NOT EXISTS relief_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  latitude numeric NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude numeric NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  location_name text NOT NULL,
  relief_type text NOT NULL CHECK (relief_type IN ('food', 'medical', 'shelter', 'water', 'clothing', 'other')),
  description text NOT NULL,
  photo_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_relief_pins_user_id ON relief_pins(user_id);
CREATE INDEX IF NOT EXISTS idx_relief_pins_latitude ON relief_pins(latitude);
CREATE INDEX IF NOT EXISTS idx_relief_pins_longitude ON relief_pins(longitude);
CREATE INDEX IF NOT EXISTS idx_relief_pins_status ON relief_pins(status);
CREATE INDEX IF NOT EXISTS idx_relief_pins_created_at ON relief_pins(created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE relief_pins ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies

-- Public users can read their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM user_profiles WHERE id = auth.uid()));

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow profile creation on signup
CREATE POLICY "Users can create own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Relief Pins Policies

-- Anyone authenticated can view approved pins
CREATE POLICY "Users can view approved pins"
  ON relief_pins FOR SELECT
  TO authenticated
  USING (status = 'approved' AND is_active = true);

-- Users can view their own pins regardless of status
CREATE POLICY "Users can view own pins"
  ON relief_pins FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all pins
CREATE POLICY "Admins can view all pins"
  ON relief_pins FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can create pins (will be pending)
CREATE POLICY "Users can create pins"
  ON relief_pins FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

-- Users can update their own pending pins
CREATE POLICY "Users can update own pending pins"
  ON relief_pins FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

-- Admins can update any pin
CREATE POLICY "Admins can update any pin"
  ON relief_pins FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can delete their own pending pins
CREATE POLICY "Users can delete own pending pins"
  ON relief_pins FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');

-- Admins can delete any pin
CREATE POLICY "Admins can delete any pin"
  ON relief_pins FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_relief_pins_updated_at
  BEFORE UPDATE ON relief_pins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup (to be called from trigger)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url, facebook_id)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'provider_id'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
