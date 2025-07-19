-- Add test suppliers if they don't exist
INSERT INTO suppliers (name, telephone, address, payment_terms, is_active)
VALUES 
  ('ABC Suppliers', '+1-234-567-8901', '123 Business St, Commerce City, CC 12345', 'Net 30', true),
  ('XYZ Electronics', '+1-234-567-8902', '456 Tech Ave, Silicon Valley, SV 67890', 'Net 15', true),
  ('Office Supplies Co.', '+1-234-567-8903', '789 Office Blvd, Business Park, BP 54321', 'COD', true)
ON CONFLICT (name) DO NOTHING;

-- Add test inventory items if they don't exist
INSERT INTO inventory_items (name, description, category, unit_of_measure, purchase_cost, selling_price, current_stock, reorder_level, sku, is_active)
VALUES 
  ('Office Chair', 'Ergonomic office chair with lumbar support', 'Furniture', 'units', 150.00, 199.99, 25, 5, 'CHAIR-ERG-001', true),
  ('Laptop', 'Business laptop with 16GB RAM', 'Electronics', 'units', 800.00, 1199.99, 10, 2, 'LAPTOP-BUS-001', true),
  ('Printer Paper', 'A4 white printer paper, 500 sheets', 'Office Supplies', 'units', 5.00, 8.99, 100, 20, 'PAPER-A4-001', true),
  ('Monitor', '24-inch LED monitor', 'Electronics', 'units', 200.00, 299.99, 15, 3, 'MON-LED-24', true),
  ('Desk', 'Adjustable height desk', 'Furniture', 'units', 300.00, 449.99, 8, 2, 'DESK-ADJ-001', true)
ON CONFLICT (sku) DO NOTHING;

-- Add test customers if they don't exist
INSERT INTO customers (name, telephone, address, email)
VALUES 
  ('Tech Solutions Inc.', '+1-555-123-4567', '100 Innovation Drive, Tech City, TC 11111', 'orders@techsolutions.com'),
  ('Global Enterprises', '+1-555-987-6543', '200 Corporate Blvd, Business Center, BC 22222', 'purchasing@globalent.com'),
  ('StartUp Dynamics', '+1-555-456-7890', '300 Venture Lane, Innovation Hub, IH 33333', 'info@startupdynamics.com')
ON CONFLICT (email) DO NOTHING; 