-- ================================================
-- MINI ERP SYSTEM - NEW SUPABASE SCHEMA WITH RLS
-- ================================================
-- Run this in your new Supabase project SQL editor

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

-- RLS Policies for inventory_items
CREATE POLICY "Everyone can view active inventory" ON inventory_items
    FOR SELECT USING (is_active = true);

CREATE POLICY "Managers can modify inventory" ON inventory_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('manager', 'admin') AND is_active = true
        )
    );

-- ================================================
-- 3. CUSTOMERS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers
CREATE POLICY "Authenticated users can view customers" ON customers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Managers can modify customers" ON customers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('manager', 'admin') AND is_active = true
        )
    );

-- ================================================
-- 4. SUPPLIERS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    contact_info TEXT,
    payment_terms TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suppliers
CREATE POLICY "Authenticated users can view active suppliers" ON suppliers
    FOR SELECT USING (
        is_active = true AND EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Managers can modify suppliers" ON suppliers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('manager', 'admin') AND is_active = true
        )
    );

-- ================================================
-- 5. SALES ORDERS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS sales_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_amount DECIMAL(12,2) DEFAULT 0,
    payment_method TEXT,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sales_orders
CREATE POLICY "Users can view own sales orders" ON sales_orders
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Managers can view all sales orders" ON sales_orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('manager', 'admin') AND is_active = true
        )
    );

CREATE POLICY "Authenticated users can create sales orders" ON sales_orders
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Users can update own orders or managers can update all" ON sales_orders
    FOR UPDATE USING (
        created_by = auth.uid() OR EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('manager', 'admin') AND is_active = true
        )
    );

-- ================================================
-- 6. SALES ORDER ITEMS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS sales_order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sales_order_id UUID REFERENCES sales_orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES inventory_items(id) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sales_order_items
CREATE POLICY "Users can view items for accessible orders" ON sales_order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sales_orders so 
            WHERE so.id = sales_order_id AND (
                so.created_by = auth.uid() OR EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE id = auth.uid() AND role IN ('manager', 'admin') AND is_active = true
                )
            )
        )
    );

CREATE POLICY "Users can manage items for accessible orders" ON sales_order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sales_orders so 
            WHERE so.id = sales_order_id AND (
                so.created_by = auth.uid() OR EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE id = auth.uid() AND role IN ('manager', 'admin') AND is_active = true
                )
            )
        )
    );

-- ================================================
-- 7. PURCHASE ORDERS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'ordered', 'received', 'cancelled')),
    total_amount DECIMAL(12,2) DEFAULT 0,
    expected_delivery TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for purchase_orders
CREATE POLICY "Managers can manage purchase orders" ON purchase_orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('manager', 'admin') AND is_active = true
        )
    );

-- ================================================
-- 8. PRODUCTION ORDERS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS production_orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    bom_id UUID, -- Bill of Materials ID (to be implemented later)
    quantity_to_produce INTEGER NOT NULL CHECK (quantity_to_produce > 0),
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    start_date TIMESTAMP WITH TIME ZONE,
    completion_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE production_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for production_orders
CREATE POLICY "Managers can manage production orders" ON production_orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('manager', 'admin') AND is_active = true
        )
    );

-- ================================================
-- 9. FINANCIAL TRANSACTIONS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(12,2) NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_method TEXT,
    reference_number TEXT,
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for financial_transactions
CREATE POLICY "Managers can manage financial transactions" ON financial_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('manager', 'admin') AND is_active = true
        )
    );

-- ================================================
-- 10. AUDIT LOGS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view all audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin' AND is_active = true
        )
    );

-- ================================================
-- 11. FUNCTIONS AND TRIGGERS
-- ================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_orders_updated_at BEFORE UPDATE ON sales_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_production_orders_updated_at BEFORE UPDATE ON production_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE ON financial_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 12. INDEXES FOR PERFORMANCE
-- ================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_date ON sales_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);

-- ================================================
-- 13. SEED DATA
-- ================================================

-- Insert test data (will be executed after user registration)
-- This data will be inserted through the API to ensure proper RLS compliance
