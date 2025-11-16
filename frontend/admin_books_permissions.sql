-- Admin permissions for books table
-- This allows admin users to manage books (INSERT, UPDATE, DELETE)

-- Enable Row Level Security on books table (if not already enabled)
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Policy: Allow admins to insert books
-- This checks if the user has is_admin = TRUE in their user_profiles
CREATE POLICY "Admins can insert books"
  ON books
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_admin = TRUE
    )
  );

-- Policy: Allow admins to update books
CREATE POLICY "Admins can update books"
  ON books
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_admin = TRUE
    )
  );

-- Policy: Allow admins to delete books
CREATE POLICY "Admins can delete books"
  ON books
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.is_admin = TRUE
    )
  );

-- Note: The existing "Allow public read access" policy for SELECT should remain
-- This allows all users (including non-authenticated) to read books

