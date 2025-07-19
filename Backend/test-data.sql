-- ================================================
-- TEST DATA MIGRATION SCRIPT
-- ================================================
-- Run this after setting up your schema and creating users
-- This preserves your existing test data structure

-- Insert test suppliers
INSERT INTO suppliers (name, contact_info, payment_terms, is_active)
VALUES 
  ('ABC Suppliers', '+1-234-567-8901', 'Net 30', true),
  ('XYZ Electronics', '+1-234-567-8902', 'Net 15', true),
  ('Office Supplies Co.', '+1-234-567-8903', 'COD', true),
  ('Global Hardware Ltd.', '+1-234-567-8904', 'Net 45', true),
  ('Premium Parts Inc.', '+1-234-567-8905', 'Net 20', true)
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
INSERT INTO customers (name, email, phone, address)
VALUES 
  ('Tech Solutions Inc.', 'orders@techsolutions.com', '+1-555-123-4567', '100 Innovation Drive, Tech City, TC 11111'),
  ('Global Enterprises', 'purchasing@globalent.com', '+1-555-987-6543', '200 Corporate Blvd, Business Center, BC 22222'),
  ('StartUp Dynamics', 'info@startupdynamics.com', '+1-555-456-7890', '300 Venture Lane, Innovation Hub, IH 33333'),
  ('Retail Masters Corp.', 'sales@retailmasters.com', '+1-555-111-2222', '400 Commerce Street, Retail District, RD 44444'),
  ('Manufacturing Pro Ltd.', 'orders@mfgpro.com', '+1-555-333-4444', '500 Industrial Park, Factory Zone, FZ 55555')
ON CONFLICT (email) DO NOTHING;

-- Note: Financial transactions and other data should be created through the API
-- to ensure proper user attribution and audit trails
