# Supabase Personalization Setup Guide

This guide will help you set up the database schema for storing user personalization data.

## Overview

The personalization data will be stored in a `user_profiles` table that:
- Uses the same `user_id` as the authentication system
- Stores username, date of birth, gender, favorite authors, genres, and languages
- Has Row Level Security (RLS) enabled so users can only access their own data
- Automatically updates timestamps

---

## Step 1: Access Supabase SQL Editor

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **"SQL Editor"** in the left sidebar (database icon)
4. Click **"New Query"** button

---

## Step 2: Run the Schema SQL

Copy the entire contents of `supabase_schema.sql` and paste it into the SQL Editor, then click **"Run"** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac).

The SQL file is located at: `NextChapter/frontend/supabase_schema.sql`

### What this SQL does:

1. **Creates the `user_profiles` table** with these columns:
   - `user_id` (UUID) - Links to auth.users
   - `username` (TEXT)
   - `date_of_birth` (DATE)
   - `gender` (TEXT)
   - `favorite_authors` (TEXT[]) - Array of author names
   - `genres` (TEXT[]) - Array of selected genres
   - `languages` (TEXT[]) - Array of languages
   - `completed_at` (TIMESTAMP) - When personalization was completed
   - `created_at` (TIMESTAMP) - Auto-set on creation
   - `updated_at` (TIMESTAMP) - Auto-updated on changes

2. **Enables Row Level Security (RLS)** - Users can only access their own data

3. **Creates Security Policies**:
   - Users can view their own profile
   - Users can insert their own profile
   - Users can update their own profile
   - Users can delete their own profile

4. **Creates Auto-Update Trigger** - Automatically updates `updated_at` timestamp

5. **Creates Index** - For faster lookups

---

## Step 3: Verify Table Creation

1. Click on **"Table Editor"** in the left sidebar
2. You should see a new table called `user_profiles`
3. Click on it to see the structure

---

## Step 4: Test the Integration

1. Make sure your `.env` file has:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

2. Start your development server:
   ```bash
   npm run dev
   ```

3. Sign up or sign in to your app

4. Complete the personalization form (all 4 steps)

5. Check Supabase Table Editor:
   - Go to Table Editor → `user_profiles`
   - You should see your data stored with your user_id

---

## How It Works

### Data Storage
- When a user completes personalization, data is saved to `user_profiles` table
- The `user_id` matches their authentication UUID
- Data is automatically protected by RLS policies

### Data Retrieval
- On page load, the app checks if the user has completed personalization
- If `completed_at` exists, they're redirected to `/books`
- Only the logged-in user can see their own profile data

### Updates
- If a user completes personalization again, the data is updated (upsert)
- The `updated_at` timestamp is automatically updated

---

## Troubleshooting

### Error: "permission denied for table user_profiles"
- Make sure RLS policies were created correctly
- Re-run the SQL script

### Error: "relation 'user_profiles' does not exist"
- The table wasn't created
- Check SQL Editor for any errors when running the script
- Make sure you ran the entire script

### Data not saving
1. Open browser console (F12) and check for errors
2. Verify your Supabase URL and Anon Key in `.env`
3. Check Network tab to see if requests are going through
4. Verify the table exists in Supabase Table Editor

### Users being redirected before completing personalization
- Clear your browser's localStorage
- Check if `completed_at` is null in the database for that user

---

## Database Schema Diagram

```
┌─────────────────────────────────────────┐
│          user_profiles                  │
├─────────────────────────────────────────┤
│ user_id           UUID (PK, FK)         │
│ username          TEXT                  │
│ date_of_birth     DATE                  │
│ gender            TEXT                  │
│ favorite_authors  TEXT[]                │
│ genres            TEXT[]                │
│ languages         TEXT[]                │
│ completed_at      TIMESTAMP             │
│ created_at        TIMESTAMP (auto)      │
│ updated_at        TIMESTAMP (auto)      │
└─────────────────────────────────────────┘
         │
         │ References
         ↓
┌─────────────────────────────────────────┐
│         auth.users (Supabase)           │
├─────────────────────────────────────────┤
│ id                UUID (PK)             │
│ email             TEXT                  │
│ ...                                     │
└─────────────────────────────────────────┘
```

---

## Next Steps

After setup is complete:
- Users will have their personalization saved to Supabase
- You can query this data for personalized recommendations
- You can add more fields to the profile later by modifying the table

---

## Need Help?

If you encounter issues:
1. Check the Supabase logs (Logs → Postgres Logs)
2. Verify your RLS policies are enabled
3. Ensure your `.env` file has the correct credentials
4. Check browser console for JavaScript errors

