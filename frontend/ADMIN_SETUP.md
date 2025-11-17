# Admin Dashboard Setup Guide

This guide will help you set up admin roles so that admins can log in through the same sign-in page and access the admin dashboard.

## Overview

The admin system works as follows:
- Admins log in through the same `/sign-in` page as regular users
- After login, admins are automatically redirected to `/admin` dashboard
- Regular users are redirected to `/books` page (or `/personalization` if not completed)
- Admin status is stored in the `user_profiles` table with an `is_admin` boolean field
- Admin dashboard is protected - only users with `is_admin = TRUE` can access it

## Step 1: Run Database Schema Updates

### 1.1 Add Admin Role Column

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New Query"** button
5. Copy and paste the contents of `admin_schema.sql` and click **"Run"**

This will:
- Add `is_admin` column to `user_profiles` table
- Create an index for faster admin lookups

### 1.2 Add Admin Permissions for Books Table

1. In the SQL Editor, create a new query
2. Copy and paste the contents of `admin_books_permissions.sql` and click **"Run"**

This will:
- Create RLS policies that allow admins to INSERT, UPDATE, and DELETE books
- Regular users can still READ books (public access)

## Step 2: Make a User an Admin

### Option 1: Via Supabase Dashboard

1. Go to **"Table Editor"** in the left sidebar
2. Click on the `user_profiles` table
3. Find the user you want to make an admin
4. Click on the row to edit it
5. Set `is_admin` to `TRUE`
6. Click **"Save"**

### Option 2: Via SQL Editor

1. Go to **"SQL Editor"** in the left sidebar
2. Run the following SQL (replace `'your-user-id-here'` with the actual user ID):

```sql
UPDATE user_profiles 
SET is_admin = TRUE 
WHERE user_id = 'your-user-id-here';
```

To find a user's ID:
1. Go to **"Authentication"** → **"Users"** in the left sidebar
2. Find the user you want to make admin
3. Copy their UUID (user ID)
4. Use it in the SQL query above

## Step 3: Test Admin Login

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/sign-in` in your browser

3. Sign in with the admin user's email and password

4. You should be automatically redirected to `/admin` dashboard

5. Verify that:
   - You can see the admin dashboard
   - You can add, edit, and delete books
   - Regular users cannot access `/admin` (they'll be redirected to `/books`)

## Step 4: Verify Admin Protection

1. Sign in as a regular (non-admin) user
2. Try to navigate to `/admin` directly
3. You should be redirected to `/books` page
4. This confirms that admin protection is working

## How It Works

### Authentication Flow

1. **User Signs In** → Same `/sign-in` page for all users
2. **Check Admin Status** → System checks if `is_admin = TRUE` in `user_profiles`
3. **Redirect Based on Role**:
   - **Admin** → Redirected to `/admin` dashboard
   - **Regular User** → Redirected to `/books` (or `/personalization` if not completed)

### Admin Dashboard Protection

- The `/admin` route is protected by the `Admin` component
- It checks if the user is authenticated
- It checks if the user is an admin (`is_admin = TRUE`)
- If not admin, redirects to `/books`
- If not authenticated, redirects to `/sign-in`

### Database Permissions

- **Public Access**: All users (including non-authenticated) can READ books
- **Admin Access**: Only users with `is_admin = TRUE` can:
  - INSERT new books
  - UPDATE existing books
  - DELETE books
  - Upload PDF files and cover images to Supabase Storage

## Troubleshooting

### Issue: Admin cannot access `/admin` dashboard

**Solution:**
1. Check if `is_admin` is set to `TRUE` in the `user_profiles` table
2. Verify the user_id matches the authenticated user's ID
3. Check browser console for any errors
4. Verify RLS policies are set up correctly

### Issue: Admin redirected to `/books` instead of `/admin`

**Solution:**
1. Check if `is_admin = TRUE` in `user_profiles` table
2. Verify the user is authenticated (check `auth.users` table)
3. Check browser console for errors in the `isAdmin()` function
4. Make sure the `admin_schema.sql` was run successfully

### Issue: Cannot insert/update/delete books

**Solution:**
1. Verify `admin_books_permissions.sql` was run successfully
2. Check RLS policies in Supabase Dashboard → Authentication → Policies
3. Verify the user has `is_admin = TRUE` in `user_profiles`
4. Check browser console for permission errors

### Issue: "Permission denied" errors

**Solution:**
1. Make sure RLS is enabled on the `books` table
2. Verify admin policies are created correctly
3. Check that the user is authenticated (signed in)
4. Verify `is_admin = TRUE` for the user

## Security Notes

1. **Admin Role Management**: Only super admins (database administrators) should be able to set `is_admin = TRUE`. Regular users cannot change their own admin status.

2. **RLS Policies**: Row Level Security (RLS) policies ensure that only admins can modify books, even if someone tries to bypass the frontend checks.

3. **Storage Permissions**: Make sure your Supabase Storage bucket (`Book-storage`) has proper policies for admins to upload files.

4. **Audit Logging**: Consider adding audit logs to track admin actions (book creation, updates, deletions) for security and compliance.

## Next Steps

1. **Create Multiple Admins**: Add more admin users as needed
2. **Add Admin Features**: Enhance the admin dashboard with more features:
   - User management
   - Analytics and reports
   - Content moderation
   - System settings
3. **Role-Based Permissions**: Consider adding more granular roles (e.g., "Editor", "Moderator") with different permissions

## Need Help?

If you encounter issues:
1. Check the Supabase logs (Logs → Postgres Logs)
2. Verify your RLS policies are enabled
3. Check browser console for errors
4. Verify your `.env` file has correct Supabase credentials

