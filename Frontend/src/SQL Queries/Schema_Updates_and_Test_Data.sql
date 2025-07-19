-- ================================================
-- MINI ERP SYSTEM - SCHEMA UPDATES & TEST DATA
-- ================================================
-- This file contains only the new/updated queries needed
-- Run these after your main schema is in place

-- ================================================
-- 1. SCHEMA FIXES & UPDATES
-- ================================================

-- Ensure purchase_order_items has proper constraints (if not already present)
DO $$ 
BEGIN
    -- Add unique constraint on supplier name if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'suppliers_name_unique'
    ) THEN
        ALTER TABLE suppliers ADD CONSTRAINT suppliers_name_unique UNIQUE (name);
    END IF;

    -- Add unique constraint on inventory item SKU if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'inventory_items_sku_unique'
    ) THEN
        ALTER TABLE inventory_items ADD CONSTRAINT inventory_items_sku_unique UNIQUE (sku);
    END IF;

    -- Add unique constraint on customer email if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'customers_email_unique'
    ) THEN
        ALTER TABLE customers ADD CONSTRAINT customers_email_unique UNIQUE (email);
    END IF;
END $$;

-- ================================================
-- 2. TEST DATA INSERTION
-- ================================================

-- Insert test suppliers
INSERT INTO suppliers (name, telephone, address, payment_terms, is_active)
VALUES 
  ('ABC Suppliers', '+1-234-567-8901', '123 Business St, Commerce City, CC 12345', 'Net 30', true),
  ('XYZ Electronics', '+1-234-567-8902', '456 Tech Ave, Silicon Valley, SV 67890', 'Net 15', true),
  ('Office Supplies Co.', '+1-234-567-8903', '789 Office Blvd, Business Park, BP 54321', 'COD', true),
  ('Global Hardware Ltd.', '+1-234-567-8904', '321 Industrial Way, Manufacturing District, MD 98765', 'Net 45', true),
  ('Premium Parts Inc.', '+1-234-567-8905', '654 Components Ave, Tech Hub, TH 13579', 'Net 20', true)
ON CONFLICT (name) DO NOTHING;

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

-- Insert test customers
INSERT INTO customers (name, telephone, address, email)
VALUES 
  ('Tech Solutions Inc.', '+1-555-123-4567', '100 Innovation Drive, Tech City, TC 11111', 'orders@techsolutions.com'),
  ('Global Enterprises', '+1-555-987-6543', '200 Corporate Blvd, Business Center, BC 22222', 'purchasing@globalent.com'),
  ('StartUp Dynamics', '+1-555-456-7890', '300 Venture Lane, Innovation Hub, IH 33333', 'info@startupdynamics.com'),
  ('Retail Masters Corp.', '+1-555-111-2222', '400 Commerce Street, Retail District, RD 44444', 'sales@retailmasters.com'),
  ('Manufacturing Pro Ltd.', '+1-555-333-4444', '500 Industrial Park, Factory Zone, FZ 55555', 'orders@mfgpro.com')
ON CONFLICT (email) DO NOTHING;

-- ================================================
-- 3. SAMPLE FINANCIAL TRANSACTIONS
-- ================================================

-- Insert sample expense transactions
INSERT INTO financial_transactions (type, amount, category, description, date, payment_method, reference_number)
VALUES 
  ('expense', 1500.00, 'Office Rent', 'Monthly office rent payment', NOW() - INTERVAL '30 days', 'bank', 'TXN-RENT-001'),
  ('expense', 850.00, 'Utilities', 'Electricity and internet bills', NOW() - INTERVAL '25 days', 'bank', 'TXN-UTIL-001'),
  ('expense', 2500.00, 'Equipment', 'New computer equipment purchase', NOW() - INTERVAL '20 days', 'card', 'TXN-EQUIP-001'),
  ('income', 5000.00, 'Sales', 'Product sales revenue', NOW() - INTERVAL '15 days', 'bank', 'TXN-SALES-001'),
  ('income', 3200.00, 'Services', 'Consulting services income', NOW() - INTERVAL '10 days', 'bank', 'TXN-SERV-001')
ON CONFLICT DO NOTHING;

-- ================================================
-- 4. USEFUL QUERIES FOR TESTING
-- ================================================

-- View to check purchase orders with supplier details
CREATE OR REPLACE VIEW purchase_orders_with_details AS
SELECT 
    po.id,
    po.order_number,
    po.status,
    po.total_amount,
    po.expected_delivery_date,
    po.created_at,
    s.name as supplier_name,
    s.telephone as supplier_phone,
    COUNT(poi.id) as item_count
FROM purchase_orders po
LEFT JOIN suppliers s ON po.supplier_id = s.id
LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
GROUP BY po.id, s.id, s.name, s.telephone
ORDER BY po.created_at DESC;

-- View for inventory with low stock alerts
CREATE OR REPLACE VIEW low_stock_items AS
SELECT 
    id,
    name,
    sku,
    current_stock,
    reorder_level,
    category,
    (reorder_level - current_stock) as shortage_amount
FROM inventory_items 
WHERE current_stock <= reorder_level 
AND is_active = true
ORDER BY (reorder_level - current_stock) DESC;

-- ================================================
-- 5. VERIFICATION QUERIES
-- ================================================

-- Check if all tables have data
SELECT 
    'suppliers' as table_name, COUNT(*) as record_count FROM suppliers
UNION ALL
SELECT 
    'inventory_items' as table_name, COUNT(*) as record_count FROM inventory_items
UNION ALL
SELECT 
    'customers' as table_name, COUNT(*) as record_count FROM customers
UNION ALL
SELECT 
    'purchase_orders' as table_name, COUNT(*) as record_count FROM purchase_orders
UNION ALL
SELECT 
    'financial_transactions' as table_name, COUNT(*) as record_count FROM financial_transactions;

-- ================================================
-- END OF UPDATES
-- ================================================ 