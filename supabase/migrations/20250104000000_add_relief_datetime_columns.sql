-- Add datetime columns and update status enum for relief pins
-- This migration enhances the relief tracking system with time-based completion

-- Add datetime columns to relief_pins table
ALTER TABLE relief_pins 
ADD COLUMN IF NOT EXISTS start_datetime timestamptz,
ADD COLUMN IF NOT EXISTS end_datetime timestamptz;

-- Drop all existing policies that depend on the status column
DROP POLICY IF EXISTS "Users can view approved pins" ON relief_pins;
DROP POLICY IF EXISTS "Users can view own pins" ON relief_pins;
DROP POLICY IF EXISTS "Admins can view all pins" ON relief_pins;
DROP POLICY IF EXISTS "Users can create pins" ON relief_pins;
DROP POLICY IF EXISTS "Users can update own pending pins" ON relief_pins;
DROP POLICY IF EXISTS "Admins can update any pin" ON relief_pins;
DROP POLICY IF EXISTS "Users can delete own pending pins" ON relief_pins;
DROP POLICY IF EXISTS "Admins can delete any pin" ON relief_pins;

-- Update the status enum to include 'completed'
-- First, create a new enum with the additional value
CREATE TYPE relief_status_new AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- Update existing data to use the new enum
ALTER TABLE relief_pins 
ALTER COLUMN status TYPE relief_status_new 
USING status::text::relief_status_new;

-- Drop the old enum and rename the new one
DROP TYPE relief_status;
ALTER TYPE relief_status_new RENAME TO relief_status;

-- Update the check constraint
ALTER TABLE relief_pins 
DROP CONSTRAINT IF EXISTS relief_pins_status_check;

ALTER TABLE relief_pins 
ADD CONSTRAINT relief_pins_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'completed'));

-- Add comments for the new columns
COMMENT ON COLUMN relief_pins.start_datetime IS 'When the relief distribution started';
COMMENT ON COLUMN relief_pins.end_datetime IS 'When the relief distribution ended - used for auto-completion';

-- Create an index for efficient querying by end_datetime
CREATE INDEX IF NOT EXISTS idx_relief_pins_end_datetime ON relief_pins(end_datetime);

-- Create an index for active relief pins (not completed)
CREATE INDEX IF NOT EXISTS idx_relief_pins_active ON relief_pins(status, end_datetime) 
WHERE status != 'completed';

-- Recreate all the relief_pins policies with the updated status enum

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
