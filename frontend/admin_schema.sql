-- Add admin role support to user_profiles table
-- This allows admins to access the admin dashboard

-- Add is_admin column to user_profiles table (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Create index for faster admin lookups
CREATE INDEX IF NOT EXISTS user_profiles_is_admin_idx ON user_profiles(is_admin) WHERE is_admin = TRUE;

-- Update RLS policies to allow users to check their own admin status
-- The existing SELECT policy already covers this, but we ensure it works correctly

-- Note: Admin users need additional permissions for books table
-- Create policies for admin to manage books (INSERT, UPDATE, DELETE)
-- These policies should be run after this script

-- Example: To make a user an admin, run this SQL:
-- UPDATE user_profiles SET is_admin = TRUE WHERE user_id = 'your-user-id-here';

-- Or via Supabase Dashboard:
-- 1. Go to Table Editor → user_profiles
-- 2. Find the user you want to make admin
-- 3. Edit the row and set is_admin to TRUE
-- 4. Save

