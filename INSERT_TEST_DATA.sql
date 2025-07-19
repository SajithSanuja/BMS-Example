-- ================================================
-- INSERT TEST INVENTORY DATA
-- ================================================
-- Run this script in your Supabase SQL Editor to add test inventory data

-- First, let's make sure the inventory_items table exists
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

-- Enable RLS with simple policies
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all authenticated users to view inventory" ON inventory_items;
DROP POLICY IF EXISTS "Allow authenticated users to manage inventory" ON inventory_items;

-- Create simple RLS policies
CREATE POLICY "Allow all authenticated users to view inventory" ON inventory_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage inventory" ON inventory_items
    FOR ALL USING (auth.role() = 'authenticated');

-- Clear existing data and insert fresh test data
DELETE FROM inventory_items;

-- Insert comprehensive test inventory data
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
  ('Whiteboard', '6ft x 4ft magnetic whiteboard', 'Office Supplies', 'units', 120.00, 179.99, 5, 2, 'WB-MAG-6X4', true),
  ('Coffee Machine', 'Professional coffee maker for office use', 'Appliances', 'units', 250.00, 399.99, 3, 1, 'COFFEE-PRO-001', true),
  ('Conference Table', 'Large conference table for 12 people', 'Furniture', 'units', 800.00, 1299.99, 2, 1, 'TABLE-CONF-12', true),
  ('Projector', 'HD projector for presentations', 'Electronics', 'units', 600.00, 899.99, 5, 2, 'PROJ-HD-001', true),
  ('Notebook', 'A4 lined notebook, 200 pages', 'Office Supplies', 'units', 3.00, 6.99, 200, 50, 'NOTE-A4-200', true),
  ('Pen Set', 'Professional ballpoint pen set', 'Office Supplies', 'units', 12.00, 19.99, 150, 30, 'PEN-SET-PRO', true);

-- Verify the data was inserted
SELECT 
    name, 
    category, 
    purchase_cost, 
    selling_price, 
    current_stock, 
    sku 
FROM inventory_items 
ORDER BY category, name;
