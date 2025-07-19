# Supabase Authentication Fix Guide

## Problem Analysis
The "Failed to fetch user profile" error occurs because:
1. The `user_profiles` table doesn't exist in your Supabase database
2. The authentication system expects this table to store extended user information
3. When the table doesn't exist, the user gets stuck in a loading state

## Solution Steps

### Step 1: Set Up Database Table

1. **Open your Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project
   - Navigate to the SQL Editor

2. **Run the Setup Script**
   - Copy the entire content from `SUPABASE_SETUP.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

### Step 2: Verify Database Setup

After running the setup script, verify everything is working:

```sql
-- Check if table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'user_profiles';

-- Check policies
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies WHERE tablename = 'user_profiles';

-- Check if trigger exists
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'users' AND trigger_name = 'on_auth_user_created';
```

### Step 3: Test the Authentication

1. **Clear Browser Data**
   - Clear localStorage/sessionStorage
   - Refresh the page

2. **Try Login Again**
   - The system should now work properly
   - If you still get errors, check the browser console for details

### Step 4: Create Test Users (Optional)

You can create test users directly in Supabase:

1. **Via Supabase Dashboard**
   - Go to Authentication > Users
   - Add users manually

2. **Via Your App**
   - Use the registration form
   - The trigger will automatically create profiles

## Troubleshooting

### If you still get "Failed to fetch user profile":

1. **Check Supabase Console**
   - Look for error messages
   - Verify RLS policies are active

2. **Check Network Tab**
   - Look for 401/403 errors
   - Verify API calls are being made

3. **Check Browser Console**
   - Look for detailed error messages
   - Check if Supabase client is properly configured

### Common Issues:

1. **RLS Policies Too Restrictive**
   ```sql
   -- Temporarily disable RLS for testing
   ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
   ```

2. **Supabase URL/Key Issues**
   - Verify your `.env` file has correct Supabase credentials
   - Check if the API URL and anon key are correct

3. **User Already Exists Without Profile**
   ```sql
   -- Create profiles for existing users
   INSERT INTO user_profiles (id, full_name, role, is_active)
   SELECT 
     id, 
     COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
     'employee',
     true
   FROM auth.users 
   WHERE id NOT IN (SELECT id FROM user_profiles);
   ```

## Enhanced Features

The updated AuthContext now includes:

1. **Fallback Profile Creation**: Automatically creates profiles if missing
2. **Better Error Handling**: Doesn't get stuck in loading state
3. **Graceful Degradation**: Works even if database operations fail
4. **Automatic Retry**: Handles temporary database issues

## What Changed

### AuthContext.tsx
- Added fallback profile creation in `handleAuthUser`
- Improved error handling to prevent infinite loading
- Enhanced registration flow with better profile creation

### authSlice.ts
- Fixed loading state not being reset on successful login
- Added loading state reset on logout

The authentication system is now more robust and should handle edge cases gracefully.
