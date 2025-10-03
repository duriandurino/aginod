-- Rename facebook_id column to google_id in user_profiles table
-- This migration converts the authentication provider from Facebook to Google

-- Rename the column
ALTER TABLE public.user_profiles 
RENAME COLUMN facebook_id TO google_id;

-- Update the comment to reflect the change
COMMENT ON COLUMN public.user_profiles.google_id IS 'Google OAuth ID for the user';
