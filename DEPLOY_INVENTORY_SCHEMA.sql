-- BMS Database Schema - Updated for Backend Compatibility
-- Run this in your Supabase SQL Editor

-- 1. Create user_profiles table first (needed for RLS policies)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. Create update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create inventory_items table with all required fields
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  unit_of_measure TEXT NOT NULL,
  purchase_cost DECIMAL(10,2) DEFAULT 0.00,
  selling_price DECIMAL(10,2) DEFAULT 0.00,
  current_stock INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 0,
  sku TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  last_updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for inventory_items

-- Policy: All authenticated users can read inventory items
DROP POLICY IF EXISTS "Authenticated users can read inventory" ON inventory_items;
CREATE POLICY "Authenticated users can read inventory" ON inventory_items
  FOR SELECT TO authenticated
  USING (true);

-- Policy: Managers and admins can create inventory items
DROP POLICY IF EXISTS "Managers can create inventory" ON inventory_items;
CREATE POLICY "Managers can create inventory" ON inventory_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Policy: Managers and admins can update inventory items
DROP POLICY IF EXISTS "Managers can update inventory" ON inventory_items;
CREATE POLICY "Managers can update inventory" ON inventory_items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Policy: Only admins can delete inventory items
DROP POLICY IF EXISTS "Admins can delete inventory" ON inventory_items;
CREATE POLICY "Admins can delete inventory" ON inventory_items
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. Create updated_at trigger for inventory_items
DROP TRIGGER IF EXISTS update_inventory_items_updated_at ON inventory_items;
CREATE TRIGGER update_inventory_items_updated_at
    BEFORE UPDATE ON inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Create updated_at trigger for user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Grant necessary permissions
GRANT ALL ON inventory_items TO authenticated;
GRANT ALL ON inventory_items TO service_role;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO service_role;

-- 9. Create customers table for sales functionality
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  telephone TEXT,
  address TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read customers
DROP POLICY IF EXISTS "Authenticated users can read customers" ON customers;
CREATE POLICY "Authenticated users can read customers" ON customers
  FOR SELECT TO authenticated
  USING (true);

-- Policy: All authenticated users can manage customers
DROP POLICY IF EXISTS "Authenticated users can manage customers" ON customers;
CREATE POLICY "Authenticated users can manage customers" ON customers
  FOR ALL TO authenticated
  USING (true);

-- 10. Insert a default manager profile for testing (optional)
-- This will create a profile for any existing authenticated user
INSERT INTO user_profiles (id, email, full_name, role, is_active)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', email), 
  'manager',
  true
FROM auth.users 
WHERE NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.users.id)
ON CONFLICT (id) DO NOTHING;

-- Success message
SELECT 'Database schema deployed successfully! Ready for inventory management.' as status;
