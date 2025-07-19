-- BMS Database Schema - Inventory Tables
-- Run this in your Supabase SQL Editor

-- 1. Create inventory_items table
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies for inventory_items

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

-- 4. Create updated_at trigger for inventory_items
DROP TRIGGER IF EXISTS update_inventory_items_updated_at ON inventory_items;
CREATE TRIGGER update_inventory_items_updated_at
    BEFORE UPDATE ON inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Grant necessary permissions
GRANT ALL ON inventory_items TO authenticated;
GRANT ALL ON inventory_items TO service_role;

-- 6. Create sales-related tables

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  telephone TEXT,
  address TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
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

-- Grant permissions
GRANT ALL ON customers TO authenticated;
GRANT ALL ON customers TO service_role;

-- Create sales_orders table
CREATE TABLE IF NOT EXISTS sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id),
  status TEXT NOT NULL CHECK (status IN ('draft', 'confirmed', 'shipped', 'delivered', 'pending', 'processing', 'completed', 'cancelled', 'returned')) DEFAULT 'draft',
  order_date TIMESTAMPTZ DEFAULT NOW(),
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank', 'internal')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for sales_orders
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read and manage sales orders
DROP POLICY IF EXISTS "Authenticated users can manage sales orders" ON sales_orders;
CREATE POLICY "Authenticated users can manage sales orders" ON sales_orders
  FOR ALL TO authenticated
  USING (true);

-- Grant permissions
GRANT ALL ON sales_orders TO authenticated;
GRANT ALL ON sales_orders TO service_role;

-- Create sales_order_items table
CREATE TABLE IF NOT EXISTS sales_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_order_id UUID REFERENCES sales_orders(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES inventory_items(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0.00,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for sales_order_items
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can manage sales order items
DROP POLICY IF EXISTS "Authenticated users can manage sales order items" ON sales_order_items;
CREATE POLICY "Authenticated users can manage sales order items" ON sales_order_items
  FOR ALL TO authenticated
  USING (true);

-- Grant permissions
GRANT ALL ON sales_order_items TO authenticated;
GRANT ALL ON sales_order_items TO service_role;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_sales_orders_updated_at ON sales_orders;
CREATE TRIGGER update_sales_orders_updated_at
    BEFORE UPDATE ON sales_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample inventory items for testing
INSERT INTO inventory_items (name, description, category, unit_of_measure, purchase_cost, selling_price, current_stock, reorder_level, sku) VALUES
  ('Laptop Computer', 'High-performance business laptop', 'Electronics', 'pieces', 800.00, 1200.00, 50, 10, 'LAP001'),
  ('Office Chair', 'Ergonomic office chair with lumbar support', 'Furniture', 'pieces', 150.00, 250.00, 25, 5, 'CHR001'),
  ('Printer Paper', 'A4 white printer paper, 500 sheets', 'Office Supplies', 'pieces', 8.00, 12.00, 200, 50, 'PPR001'),
  ('Wireless Mouse', 'Bluetooth wireless mouse', 'Electronics', 'pieces', 25.00, 40.00, 100, 20, 'MOU001'),
  ('Desk Lamp', 'LED desk lamp with adjustable brightness', 'Office Supplies', 'pieces', 35.00, 55.00, 30, 10, 'LAM001')
ON CONFLICT (sku) DO NOTHING;

-- Insert some sample customers for testing
INSERT INTO customers (name, telephone, address, email) VALUES
  ('John Doe', '+1-555-0123', '123 Main St, City, State 12345', 'john.doe@email.com'),
  ('Jane Smith', '+1-555-0124', '456 Oak Ave, City, State 12346', 'jane.smith@email.com'),
  ('ABC Corporation', '+1-555-0125', '789 Business Blvd, City, State 12347', 'contact@abc-corp.com'),
  ('XYZ Industries', '+1-555-0126', '321 Industrial Rd, City, State 12348', 'orders@xyz-industries.com')
ON CONFLICT DO NOTHING;

-- Verification queries (run these to check if everything is set up correctly):
-- SELECT * FROM inventory_items;
-- SELECT * FROM customers;
-- SELECT * FROM sales_orders;
-- SELECT tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename IN ('inventory_items', 'customers', 'sales_orders');
