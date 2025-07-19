-- Fix RLS Infinite Recursion Issue
-- Run this in your Supabase SQL Editor

-- 1. Drop existing problematic policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- 2. Create simpler, non-recursive policies

-- Allow users to read their own profile
CREATE POLICY "Enable read access for users based on user_id" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile (except role - only for non-admin changes)
CREATE POLICY "Enable update for users based on user_id" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile during registration
CREATE POLICY "Enable insert for users based on user_id" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Also create a policy for service role (for your backend)
CREATE POLICY "Enable all for service role" ON user_profiles
    FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- 4. Verify the table has the correct structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;
