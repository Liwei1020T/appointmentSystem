-- ============================================
-- String Service Platform - Complete Database Schema
-- Database: PostgreSQL
-- Generated from Prisma Schema
-- Date: 2025-12-14
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) UNIQUE,
    full_name VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    referral_code VARCHAR(255) UNIQUE NOT NULL,
    referred_by VARCHAR(255),
    points INTEGER DEFAULT 0,
    role VARCHAR(50) DEFAULT 'customer',
    created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_referred_by ON users(referred_by);
CREATE INDEX idx_users_email ON users(email);

-- NextAuth.js Account model
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    provider VARCHAR(100) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type VARCHAR(50),
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    CONSTRAINT fk_accounts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT unique_provider_account UNIQUE (provider, provider_account_id)
);

-- NextAuth.js Session model
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    expires TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- NextAuth.js Verification Token
CREATE TABLE verification_tokens (
    identifier VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT unique_identifier_token UNIQUE (identifier, token)
);

-- ============================================
-- INVENTORY MANAGEMENT
-- ============================================

CREATE TABLE string_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model VARCHAR(255) NOT NULL,
    brand VARCHAR(255) NOT NULL,
    description TEXT,
    cost_price DECIMAL(10, 2) NOT NULL,
    selling_price DECIMAL(10, 2) NOT NULL,
    stock INTEGER DEFAULT 0,
    minimum_stock INTEGER DEFAULT 5,
    color VARCHAR(100),
    gauge VARCHAR(50),
    image_url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_string_inventory_active ON string_inventory(active);
CREATE INDEX idx_string_inventory_brand_model ON string_inventory(brand, model);

CREATE TABLE stock_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    string_id UUID NOT NULL,
    change INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'restock', 'sale', 'adjustment'
    cost_price DECIMAL(10, 2),
    reference_id UUID,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_stock_logs_string FOREIGN KEY (string_id) REFERENCES string_inventory(id),
    CONSTRAINT fk_stock_logs_user FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_stock_logs_string_id ON stock_logs(string_id);
CREATE INDEX idx_stock_logs_created_at ON stock_logs(created_at);

-- ============================================
-- PACKAGES (套餐)
-- ============================================

CREATE TABLE packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    times INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2),
    validity_days INTEGER NOT NULL,
    active BOOLEAN DEFAULT true,
    image_url TEXT,
    created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_packages_active ON packages(active);

CREATE TABLE user_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    package_id UUID NOT NULL,
    remaining INTEGER NOT NULL,
    original_times INTEGER NOT NULL,
    expiry TIMESTAMPTZ(6) NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'expired', 'depleted'
    created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_packages_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_user_packages_package FOREIGN KEY (package_id) REFERENCES packages(id)
);

CREATE INDEX idx_user_packages_user_id ON user_packages(user_id);
CREATE INDEX idx_user_packages_status ON user_packages(status);
CREATE INDEX idx_user_packages_expiry ON user_packages(expiry);

-- ============================================
-- VOUCHERS & COUPONS
-- ============================================

CREATE TABLE vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'fixed_amount', 'percentage'
    value DECIMAL(10, 2) NOT NULL,
    min_purchase DECIMAL(10, 2) DEFAULT 0,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    points_cost INTEGER DEFAULT 0,
    valid_from TIMESTAMPTZ(6) NOT NULL,
    valid_until TIMESTAMPTZ(6) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vouchers_code ON vouchers(code);
CREATE INDEX idx_vouchers_active ON vouchers(active);

CREATE TABLE user_vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    voucher_id UUID NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'used', 'expired'
    used_at TIMESTAMPTZ(6),
    order_id UUID,
    expiry TIMESTAMPTZ(6) NOT NULL,
    created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_vouchers_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_user_vouchers_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id)
);

CREATE INDEX idx_user_vouchers_user_id ON user_vouchers(user_id);
CREATE INDEX idx_user_vouchers_status ON user_vouchers(status);

-- ============================================
-- ORDERS & BOOKINGS
-- ============================================

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    string_id UUID,
    tension INTEGER,
    price DECIMAL(10, 2) NOT NULL,
    cost DECIMAL(10, 2),
    profit DECIMAL(10, 2),
    discount DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2),
    status VARCHAR(50) NOT NULL, -- 'pending', 'in_progress', 'completed', 'cancelled'
    use_package BOOLEAN DEFAULT false,
    package_used_id UUID,
    voucher_used_id UUID,
    notes TEXT,
    completed_at TIMESTAMPTZ(6),
    created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_orders_string FOREIGN KEY (string_id) REFERENCES string_inventory(id),
    CONSTRAINT fk_orders_package_used FOREIGN KEY (package_used_id) REFERENCES user_packages(id),
    CONSTRAINT fk_orders_voucher_used FOREIGN KEY (voucher_used_id) REFERENCES user_vouchers(id)
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- ============================================
-- ORDER PHOTOS
-- ============================================

CREATE TABLE order_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL,
    photo_url TEXT NOT NULL,
    photo_type VARCHAR(50) NOT NULL CHECK (photo_type IN ('before', 'after', 'detail', 'other')),
    caption TEXT,
    display_order INTEGER DEFAULT 0,
    uploaded_by UUID,
    created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_photos_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_photos_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE INDEX idx_order_photos_order_id ON order_photos(order_id);
CREATE INDEX idx_order_photos_created_at ON order_photos(created_at DESC);
CREATE INDEX idx_order_photos_type ON order_photos(photo_type);

CREATE TRIGGER update_order_photos_updated_at BEFORE UPDATE ON order_photos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- REVIEWS & RATINGS
-- ============================================

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL,
    user_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    photos TEXT[],
    created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PAYMENTS
-- ============================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID,
    package_id UUID,
    user_id UUID NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    provider VARCHAR(50) NOT NULL, -- 'fpx', 'tng', 'stripe', 'card', 'manual'
    status VARCHAR(50) NOT NULL, -- 'pending', 'success', 'failed', 'refunded'
    transaction_id VARCHAR(255) UNIQUE,
    metadata JSONB,
    created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id),
    CONSTRAINT fk_payments_package FOREIGN KEY (package_id) REFERENCES packages(id)
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);

-- ============================================
-- POINTS SYSTEM
-- ============================================

CREATE TABLE points_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    amount INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'order', 'referral', 'redeem', 'admin_grant'
    reference_id UUID,
    description TEXT,
    balance_after INTEGER NOT NULL,
    created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_points_log_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_points_log_user_id ON points_log(user_id);
CREATE INDEX idx_points_log_created_at ON points_log(created_at);

-- ============================================
-- REFERRAL SYSTEM
-- ============================================

CREATE TABLE referral_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL,
    referred_id UUID NOT NULL,
    referral_code VARCHAR(255) NOT NULL,
    reward_given BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_referral_logs_referrer FOREIGN KEY (referrer_id) REFERENCES users(id),
    CONSTRAINT fk_referral_logs_referred FOREIGN KEY (referred_id) REFERENCES users(id)
);

CREATE INDEX idx_referral_logs_referrer_id ON referral_logs(referrer_id);
CREATE INDEX idx_referral_logs_referred_id ON referral_logs(referred_id);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'order', 'package', 'promo', 'system'
    read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- ============================================
-- SYSTEM SETTINGS
-- ============================================

CREATE TABLE system_settings (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_string_inventory_updated_at BEFORE UPDATE ON string_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_packages_updated_at BEFORE UPDATE ON user_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Create admin user (password: admin123)
INSERT INTO users (email, phone, full_name, password, referral_code, role, points)
VALUES (
    'admin@string.com',
    '+60123456789',
    'System Admin',
    '$2b$10$gS6nf5ekzaQlPmnCPNFv0OIrSW9/36jvZlZ9mkL7Iga6N2Epewsq', -- Replace with actual bcrypt hash
    'ADMIN001',
    'admin',
    0
);

-- Create sample packages
INSERT INTO packages (name, description, times, price, original_price, validity_days, active)
VALUES
    ('入门套餐', '适合新手的基础套餐，包含5次穿线服务', 5, 150.00, 200.00, 90, true),
    ('标准套餐', '最受欢迎的套餐选择，包含10次穿线服务', 10, 280.00, 400.00, 180, true),
    ('高级套餐', '专业选手首选，包含20次穿线服务', 20, 520.00, 800.00, 365, true);

-- Create sample vouchers
INSERT INTO vouchers (code, name, type, value, min_purchase, max_uses, valid_from, valid_until, active)
VALUES
    ('WELCOME10', '新用户优惠券', 'percentage', 10.00, 50.00, 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days', true),
    ('SAVE20', '满减优惠券', 'fixed_amount', 20.00, 100.00, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '60 days', true);

-- Create sample string inventory
INSERT INTO string_inventory (model, brand, cost_price, selling_price, stock, minimum_stock, color, gauge, active)
VALUES
    ('BG80', 'YONEX', 15.00, 30.00, 100, 20, 'White', '0.68mm', true),
    ('BG65', 'YONEX', 12.00, 25.00, 150, 30, 'White', '0.70mm', true),
    ('Aerobite', 'YONEX', 18.00, 35.00, 80, 15, 'Orange/White', '0.67mm', true),
    ('NBG99', 'LI-NING', 20.00, 38.00, 60, 10, 'Gold', '0.69mm', true);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE users IS '用户表 - 存储所有用户信息（客户和管理员）';
COMMENT ON TABLE accounts IS 'NextAuth账户表 - OAuth提供商关联';
COMMENT ON TABLE sessions IS 'NextAuth会话表 - 用户会话管理';
COMMENT ON TABLE string_inventory IS '球线库存表 - 管理所有球线产品';
COMMENT ON TABLE stock_logs IS '库存日志表 - 记录所有库存变动';
COMMENT ON TABLE packages IS '套餐表 - 定义可购买的穿线套餐';
COMMENT ON TABLE user_packages IS '用户套餐表 - 用户购买的套餐及剩余次数';
COMMENT ON TABLE vouchers IS '优惠券表 - 系统优惠券定义';
COMMENT ON TABLE user_vouchers IS '用户优惠券表 - 用户领取的优惠券';
COMMENT ON TABLE orders IS '订单表 - 所有穿线订单记录';
COMMENT ON TABLE order_photos IS '订单照片表 - 订单前后对比照片及细节照片';
COMMENT ON TABLE payments IS '支付表 - 支付交易记录（套餐购买、订单支付）';
COMMENT ON TABLE points_log IS '积分日志表 - 用户积分变动记录';
COMMENT ON TABLE referral_logs IS '推荐日志表 - 用户推荐关系记录';
COMMENT ON TABLE notifications IS '通知表 - 用户通知消息';
COMMENT ON TABLE system_settings IS '系统设置表 - 全局配置项';

-- ============================================
-- END OF SCHEMA
-- ============================================
