-- ================================================
-- MINI ERP SYSTEM - SUPABASE DATABASE SETUP
-- ================================================
-- Copy and paste this entire script into your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 1. USER PROFILES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('manager', 'employee', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Managers can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('manager', 'admin')
        )
    );

CREATE POLICY "Managers can insert profiles" ON user_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('manager', 'admin')
        )
    );

-- ================================================
-- 2. INVENTORY ITEMS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    unit_of_measure TEXT NOT NULL,
    purchase_cost DECIMAL(12,2) DEFAULT 0,
    selling_price DECIMAL(12,2) DEFAULT 0,
    current_stock INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 0,
    sku TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory_items - SIMPLIFIED TO AVOID INFINITE RECURSION
CREATE POLICY "Allow all authenticated users to view inventory" ON inventory_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage inventory" ON inventory_items
    FOR ALL USING (auth.role() = 'authenticated');

-- ================================================
-- 3. INSERT INITIAL TEST DATA
-- ================================================
-- Insert test inventory items
INSERT INTO inventory_items (name, description, category, unit_of_measure, purchase_cost, selling_price, current_stock, reorder_level, sku, is_active)
VALUES 
  ('Office Chair', 'Ergonomic office chair with lumbar support', 'Furniture', 'units', 150.00, 199.99, 25, 5, 'CHAIR-ERG-001', true),
  ('Laptop', 'Business laptop with 16GB RAM', 'Electronics', 'units', 800.00, 1199.99, 10, 2, 'LAPTOP-BUS-001', true),
  ('Printer Paper', 'A4 white printer paper, 500 sheets', 'Office Supplies', 'units', 5.00, 8.99, 100, 20, 'PAPER-A4-001', true),
  ('Monitor', '24-inch LED monitor', 'Electronics', 'units', 200.00, 299.99, 15, 3, 'MON-LED-24', true),
  ('Desk', 'Adjustable height desk', 'Furniture', 'units', 300.00, 449.99, 8, 2, 'DESK-ADJ-001', true),
  ('Wireless Mouse', 'Ergonomic wireless mouse', 'Electronics', 'units', 25.00, 39.99, 50, 10, 'MOUSE-WL-001', true),
  ('Keyboard', 'Mechanical keyboard with backlight', 'Electronics', 'units', 75.00, 129.99, 30, 5, 'KB-MECH-001', true),
  ('Filing Cabinet', '4-drawer metal filing cabinet', 'Furniture', 'units', 180.00, 249.99, 12, 3, 'FILE-CAB-4D', true),
  ('Stapler', 'Heavy-duty desktop stapler', 'Office Supplies', 'units', 15.00, 24.99, 75, 15, 'STAPLE-HD-001', true),
  ('Whiteboard', '6ft x 4ft magnetic whiteboard', 'Office Supplies', 'units', 120.00, 179.99, 5, 2, 'WB-MAG-6X4', true)
ON CONFLICT (sku) DO NOTHING;

-- ================================================
-- 4. CREATE TEST USER FUNCTION
-- ================================================
-- This function will create a test user programmatically
CREATE OR REPLACE FUNCTION create_test_user()
RETURNS void
LANGUAGE plpgsql
SECURITY definer
AS $$
DECLARE
    new_user_id uuid;
BEGIN
    -- Check if test user already exists
    IF NOT EXISTS (
        SELECT 1 FROM auth.users WHERE email = 'manager@example.com'
    ) THEN
        -- Insert into auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token,
            email_change_token_new,
            email_change
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'manager@example.com',
            crypt('password123', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        ) RETURNING id INTO new_user_id;

        -- Insert corresponding user profile
        INSERT INTO user_profiles (id, full_name, role, is_active)
        VALUES (new_user_id, 'Test Manager', 'manager', true);
        
        RAISE NOTICE 'Test user created successfully with ID: %', new_user_id;
    ELSE
        RAISE NOTICE 'Test user already exists';
    END IF;
END;
$$;

-- Execute the function to create test user
SELECT create_test_user();
