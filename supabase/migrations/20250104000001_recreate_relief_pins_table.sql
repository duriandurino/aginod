-- Drop and recreate relief_pins table with datetime columns and updated status enum
-- This is a clean slate approach for testing mode

-- Drop existing table (this will also drop all policies and constraints)
DROP TABLE IF EXISTS relief_pins CASCADE;

-- Create the new relief_status enum with all values
DROP TYPE IF EXISTS relief_status CASCADE;
CREATE TYPE relief_status AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- Recreate the relief_pins table with all features
CREATE TABLE relief_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  location_name TEXT NOT NULL,
  relief_type TEXT NOT NULL CHECK (relief_type IN ('food', 'medical', 'shelter', 'water', 'clothing', 'other')),
  description TEXT NOT NULL,
  photo_url TEXT,
  status relief_status NOT NULL DEFAULT 'pending',
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_datetime timestamptz,
  end_datetime timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_relief_pins_user_id ON relief_pins(user_id);
CREATE INDEX idx_relief_pins_status ON relief_pins(status);
CREATE INDEX idx_relief_pins_location ON relief_pins(latitude, longitude);
CREATE INDEX idx_relief_pins_created_at ON relief_pins(created_at);
CREATE INDEX idx_relief_pins_end_datetime ON relief_pins(end_datetime);
CREATE INDEX idx_relief_pins_active ON relief_pins(status, end_datetime) 
WHERE status != 'completed';

-- Add comments for documentation
COMMENT ON TABLE relief_pins IS 'Stores relief distribution pins with location and status information';
COMMENT ON COLUMN relief_pins.start_datetime IS 'When the relief distribution started';
COMMENT ON COLUMN relief_pins.end_datetime IS 'When the relief distribution ended - used for auto-completion';
COMMENT ON COLUMN relief_pins.status IS 'Current status: pending, approved, rejected, or completed';
COMMENT ON COLUMN relief_pins.is_active IS 'Whether the pin is visible to users (false = hidden)';

-- Enable Row Level Security
ALTER TABLE relief_pins ENABLE ROW LEVEL SECURITY;

-- Create all RLS policies

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
    auth.uid() IN (
      SELECT id FROM user_profiles 
      WHERE role = 'admin'
    )
  );

-- Users can create pins (will be approved by default)
CREATE POLICY "Users can create pins"
  ON relief_pins FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

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
    auth.uid() IN (
      SELECT id FROM user_profiles 
      WHERE role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM user_profiles 
      WHERE role = 'admin'
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
    auth.uid() IN (
      SELECT id FROM user_profiles 
      WHERE role = 'admin'
    )
  );

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_relief_pins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_relief_pins_updated_at
  BEFORE UPDATE ON relief_pins
  FOR EACH ROW
  EXECUTE FUNCTION update_relief_pins_updated_at();
