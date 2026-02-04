-- Sosina Mart Database Schema
-- Version: 1.0.0
-- Description: Complete database schema for ecommerce platform with CRM and AI chat

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- Users Table (Authentication)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =============================================
-- Email Verifications Table
-- =============================================
CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_verifications_token ON email_verifications(token);
CREATE INDEX idx_email_verifications_user_id ON email_verifications(user_id);

-- =============================================
-- Password Resets Table
-- =============================================
CREATE TABLE IF NOT EXISTS password_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_password_resets_token ON password_resets(token);

-- =============================================
-- Products Table
-- =============================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
    category VARCHAR(50) NOT NULL CHECK (category IN ('food', 'kitchenware', 'artifacts')),
    image VARCHAR(500),
    in_stock BOOLEAN DEFAULT TRUE,
    featured BOOLEAN DEFAULT FALSE,
    embedding VECTOR(1536), -- For semantic search (requires pgvector extension)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_featured ON products(featured) WHERE featured = TRUE;
CREATE INDEX idx_products_in_stock ON products(in_stock) WHERE in_stock = TRUE;

-- =============================================
-- Customers Table (CRM)
-- =============================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    address TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
    email_verified BOOLEAN DEFAULT FALSE,
    marketing_consent BOOLEAN DEFAULT FALSE,
    notes TEXT,
    -- CRM Stats (auto-updated via triggers)
    customer_since TIMESTAMPTZ DEFAULT NOW(),
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(12, 2) DEFAULT 0,
    average_order_value DECIMAL(10, 2) DEFAULT 0,
    last_order_at TIMESTAMPTZ,
    last_interaction_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_total_spent ON customers(total_spent DESC);
CREATE INDEX idx_customers_total_orders ON customers(total_orders DESC);

-- =============================================
-- Customer Segments Table
-- =============================================
CREATE TABLE IF NOT EXISTS customer_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    rules JSONB NOT NULL, -- Array of rule objects
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default segments
INSERT INTO customer_segments (name, description, rules, is_active) VALUES
('VIP Customers', 'Customers who have spent over $500', '[{"field": "total_spent", "operator": "gte", "value": 500}]'::jsonb, true),
('Repeat Buyers', 'Customers with 3 or more orders', '[{"field": "total_orders", "operator": "gte", "value": 3}]'::jsonb, true),
('New Customers', 'Customers who joined in the last 30 days', '[{"field": "days_since_signup", "operator": "lte", "value": 30}]'::jsonb, true),
('At Risk', 'No order in the last 90 days', '[{"field": "days_since_last_order", "operator": "gte", "value": 90}]'::jsonb, true);

-- =============================================
-- Customer Interactions Table (CRM)
-- =============================================
CREATE TABLE IF NOT EXISTS customer_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'phone', 'chat', 'note', 'order', 'support')),
    subject VARCHAR(200) NOT NULL,
    content TEXT,
    metadata JSONB,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customer_interactions_customer_id ON customer_interactions(customer_id);
CREATE INDEX idx_customer_interactions_type ON customer_interactions(type);
CREATE INDEX idx_customer_interactions_created_at ON customer_interactions(created_at DESC);

-- =============================================
-- Orders Table
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    customer_name VARCHAR(200) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_address TEXT NOT NULL,
    items JSONB NOT NULL, -- Array of order items
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    notes TEXT,
    tracking_number VARCHAR(100),
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- =============================================
-- Order Status History Table
-- =============================================
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    note TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);

-- =============================================
-- Chat Sessions Table (AI)
-- =============================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id),
    user_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'transferred')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_customer_id ON chat_sessions(customer_id);
CREATE INDEX idx_chat_sessions_status ON chat_sessions(status);

-- =============================================
-- Chat Messages Table (AI)
-- =============================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- =============================================
-- Functions for Customer Stats Updates
-- =============================================

-- Function to update customer stats after order creation/update
CREATE OR REPLACE FUNCTION update_customer_stats(p_customer_id UUID, p_order_total DECIMAL DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    v_total_orders INTEGER;
    v_total_spent DECIMAL;
BEGIN
    -- Recalculate stats from orders
    SELECT
        COUNT(*),
        COALESCE(SUM(total), 0)
    INTO v_total_orders, v_total_spent
    FROM orders
    WHERE customer_id = p_customer_id
    AND status NOT IN ('cancelled');

    -- Update customer record
    UPDATE customers
    SET
        total_orders = v_total_orders,
        total_spent = v_total_spent,
        average_order_value = CASE WHEN v_total_orders > 0 THEN v_total_spent / v_total_orders ELSE 0 END,
        last_order_at = (SELECT MAX(created_at) FROM orders WHERE customer_id = p_customer_id AND status NOT IN ('cancelled')),
        updated_at = NOW()
    WHERE id = p_customer_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for order changes
CREATE OR REPLACE FUNCTION trigger_update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.customer_id IS NOT NULL THEN
        PERFORM update_customer_stats(NEW.customer_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on orders
DROP TRIGGER IF EXISTS trg_order_update_customer_stats ON orders;
CREATE TRIGGER trg_order_update_customer_stats
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION trigger_update_customer_stats();

-- =============================================
-- Row Level Security (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Users: Can only view/update own record (admins can view all)
CREATE POLICY users_select_own ON users FOR SELECT
    USING (auth.uid() = id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY users_update_own ON users FOR UPDATE
    USING (auth.uid() = id);

-- Customers: Admins can view all, users can view own
CREATE POLICY customers_select ON customers FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY customers_admin_all ON customers FOR ALL
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Orders: Users can view own orders, admins can view all
CREATE POLICY orders_select ON orders FOR SELECT
    USING (
        customer_email = (SELECT email FROM users WHERE id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY orders_insert ON orders FOR INSERT
    WITH CHECK (true); -- Allow anyone to create orders

CREATE POLICY orders_admin_update ON orders FOR UPDATE
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Chat Sessions: Users can view own sessions
CREATE POLICY chat_sessions_select ON chat_sessions FOR SELECT
    USING (user_id = auth.uid() OR customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));

-- Chat Messages: Users can view messages from their sessions
CREATE POLICY chat_messages_select ON chat_messages FOR SELECT
    USING (session_id IN (
        SELECT id FROM chat_sessions
        WHERE user_id = auth.uid()
        OR customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    ));

-- Products: Public read access
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY products_select ON products FOR SELECT USING (true);
CREATE POLICY products_admin_all ON products FOR ALL
    USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- =============================================
-- Seed Data: Products
-- =============================================

-- Insert products from the static data (45 products)
INSERT INTO products (id, name, description, price, category, image, in_stock, featured) VALUES
-- Food & Coffee (15 items)
('f1', 'Berbere Spice Blend', 'Traditional Ethiopian spice blend with chili peppers, garlic, and aromatic spices', 12.99, 'food', '/images/products/berbere.jpg', true, true),
('f2', 'Mitmita Spice', 'Fiery Ethiopian chili powder blend', 10.99, 'food', '/images/products/mitmita.jpg', true, false),
('f3', 'Shiro Powder', 'Ground chickpea flour with spices for traditional stew', 8.99, 'food', '/images/products/shiro.jpg', true, true),
('f4', 'Fresh Injera (10 pack)', 'Authentic fermented teff flatbread', 15.99, 'food', '/images/products/injera.jpg', true, true),
('f5', 'Yirgacheffe Coffee Beans', 'Premium Ethiopian coffee from Yirgacheffe region', 18.99, 'food', '/images/products/yirgacheffe.jpg', true, true),
('f6', 'Misir Lentils', 'Red split lentils for traditional Misir Wot', 7.99, 'food', '/images/products/misir.jpg', true, false),
('f7', 'Korerima (Ethiopian Cardamom)', 'Aromatic spice essential for Ethiopian cuisine', 9.99, 'food', '/images/products/korerima.jpg', true, false),
('f8', 'Teff Flour (1kg)', 'Gluten-free ancient grain flour for injera', 11.99, 'food', '/images/products/teff.jpg', true, false),
('f9', 'Ethiopian Honey', 'Pure raw honey from Ethiopian highlands', 24.99, 'food', '/images/products/honey.jpg', true, false),
('f10', 'Awaze Paste', 'Spicy Ethiopian condiment paste', 8.99, 'food', '/images/products/awaze.jpg', true, false),
('f11', 'Niter Kibbeh (Spiced Butter)', 'Traditional Ethiopian clarified butter with spices', 14.99, 'food', '/images/products/niter-kibbeh.jpg', true, false),
('f12', 'Harar Coffee Beans', 'Wild-grown coffee from Harar region', 17.99, 'food', '/images/products/harar-coffee.jpg', true, false),
('f13', 'Fenugreek Seeds', 'Essential spice for Ethiopian cooking', 5.99, 'food', '/images/products/fenugreek.jpg', true, false),
('f14', 'Black Cumin (Tikur Azmud)', 'Ethiopian black cumin seeds', 7.99, 'food', '/images/products/black-cumin.jpg', true, false),
('f15', 'Dried Split Peas', 'Yellow split peas for traditional dishes', 6.99, 'food', '/images/products/split-peas.jpg', true, false),

-- Kitchenware (15 items)
('k1', 'Clay Jebena Coffee Pot', 'Traditional Ethiopian clay coffee pot for authentic coffee ceremony', 49.99, 'kitchenware', '/images/products/jebena.jpg', true, true),
('k2', 'Mitad Injera Griddle', 'Large clay griddle for making traditional injera bread', 89.99, 'kitchenware', '/images/products/mitad.jpg', true, true),
('k3', 'Mesob Serving Basket', 'Colorful woven basket for serving injera and stews', 129.99, 'kitchenware', '/images/products/mesob.jpg', true, true),
('k4', 'Coffee Cup Set (Sini)', 'Set of 6 traditional handleless coffee cups', 34.99, 'kitchenware', '/images/products/coffee-cups.jpg', true, true),
('k5', 'Coffee Roasting Pan', 'Long-handled pan for roasting coffee beans', 29.99, 'kitchenware', '/images/products/roasting-pan.jpg', true, false),
('k6', 'Mortar & Pestle (Mukecha)', 'Wooden mortar and pestle for grinding spices', 39.99, 'kitchenware', '/images/products/mortar-pestle.jpg', true, false),
('k7', 'Clay Cooking Pot (Shekla)', 'Traditional clay pot for cooking stews', 44.99, 'kitchenware', '/images/products/clay-pot.jpg', true, false),
('k8', 'Woven Serving Tray', 'Colorful handwoven tray for serving food', 24.99, 'kitchenware', '/images/products/serving-tray.jpg', true, false),
('k9', 'Incense Burner (Itan)', 'Traditional clay incense burner for coffee ceremony', 19.99, 'kitchenware', '/images/products/incense-burner.jpg', true, false),
('k10', 'Rekebot Coffee Tray', 'Wooden tray stand for serving coffee ceremony', 59.99, 'kitchenware', '/images/products/rekebot.jpg', true, false),
('k11', 'Injera Basket (Sefed)', 'Flat woven basket for serving injera', 34.99, 'kitchenware', '/images/products/injera-basket.jpg', true, false),
('k12', 'Spice Container Set', 'Set of traditional containers for storing spices', 29.99, 'kitchenware', '/images/products/spice-containers.jpg', true, false),
('k13', 'Ethiopian Tea Kettle', 'Traditional kettle for brewing tea', 39.99, 'kitchenware', '/images/products/tea-kettle.jpg', true, false),
('k14', 'Berbere Grinder', 'Stone grinder for making fresh berbere spice', 54.99, 'kitchenware', '/images/products/grinder.jpg', true, false),
('k15', 'Complete Coffee Ceremony Set', 'Full set including jebena, cups, tray, and incense burner', 149.99, 'kitchenware', '/images/products/coffee-set.jpg', true, false),

-- Artifacts & Accessories (15 items)
('a1', 'Ethiopian Coptic Cross', 'Hand-crafted brass cross with traditional design', 45.99, 'artifacts', '/images/products/coptic-cross.jpg', true, true),
('a2', 'Beaded Necklace Set', 'Traditional amber and gold beaded jewelry', 34.99, 'artifacts', '/images/products/beaded-necklace.jpg', true, true),
('a3', 'Traditional Mesob Basket', 'Large woven basket for serving injera', 129.99, 'artifacts', '/images/products/mesob.jpg', true, true),
('a4', 'Clay Coffee Pot (Jebena)', 'Traditional Ethiopian coffee brewing pot', 49.99, 'artifacts', '/images/products/jebena.jpg', true, true),
('a5', 'Woven Wall Art', 'Colorful decorative wall hanging', 79.99, 'artifacts', '/images/products/wall-art.jpg', true, false),
('a6', 'Mitad Grill (Injera Pan)', 'Traditional clay griddle for making injera', 89.99, 'artifacts', '/images/products/mitad.jpg', true, false),
('a7', 'Hand-carved Wooden Cross', 'Artisan wooden Ethiopian cross', 65.99, 'artifacts', '/images/products/wooden-cross.jpg', true, false),
('a8', 'Silver Coptic Cross Pendant', 'Sterling silver cross necklace', 89.99, 'artifacts', '/images/products/silver-cross.jpg', true, false),
('a9', 'Coffee Ceremony Set', 'Complete set for traditional coffee ceremony', 149.99, 'artifacts', '/images/products/coffee-set.jpg', true, false),
('a10', 'Woven Serving Tray', 'Colorful handwoven tray', 39.99, 'artifacts', '/images/products/serving-tray.jpg', true, false),
('a11', 'Traditional Drum', 'Authentic Ethiopian kebero drum', 119.99, 'artifacts', '/images/products/drum.jpg', true, false),
('a12', 'Ethiopian Map Wall Art', 'Decorative map artwork', 59.99, 'artifacts', '/images/products/map-art.jpg', true, false),
('a13', 'Brass Incense Burner', 'Traditional incense holder', 44.99, 'artifacts', '/images/products/incense-burner.jpg', true, false),
('a14', 'Leather Bible Cover', 'Hand-tooled leather cover', 79.99, 'artifacts', '/images/products/bible-cover.jpg', true, false),
('a15', 'Colorful Basket Set (3pc)', 'Set of three decorative baskets', 69.99, 'artifacts', '/images/products/basket-set.jpg', true, false)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    category = EXCLUDED.category,
    image = EXCLUDED.image,
    in_stock = EXCLUDED.in_stock,
    featured = EXCLUDED.featured;

-- =============================================
-- Create Admin User (change password in production!)
-- =============================================
INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified)
VALUES (
    'admin@sosinamart.com',
    crypt('Admin123!', gen_salt('bf', 12)),
    'Admin',
    'User',
    'admin',
    true
) ON CONFLICT (email) DO NOTHING;

-- =============================================
-- Comments for documentation
-- =============================================
COMMENT ON TABLE users IS 'User accounts for authentication';
COMMENT ON TABLE customers IS 'Customer profiles with CRM data';
COMMENT ON TABLE products IS 'Product catalog';
COMMENT ON TABLE orders IS 'Customer orders';
COMMENT ON TABLE order_status_history IS 'Order status change history';
COMMENT ON TABLE chat_sessions IS 'AI chat sessions';
COMMENT ON TABLE chat_messages IS 'Messages within chat sessions';
COMMENT ON TABLE customer_segments IS 'Dynamic customer segmentation rules';
COMMENT ON TABLE customer_interactions IS 'Log of all customer interactions';
