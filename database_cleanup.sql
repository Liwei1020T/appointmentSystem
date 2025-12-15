-- ============================================
-- String Service Platform - Database Cleanup Script
-- This script will DELETE all tables and related objects
-- Database: PostgreSQL
-- WARNING: This will permanently delete all data!
-- ============================================

-- ============================================
-- DROP TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_string_inventory_updated_at ON string_inventory;
DROP TRIGGER IF EXISTS update_packages_updated_at ON packages;
DROP TRIGGER IF EXISTS update_user_packages_updated_at ON user_packages;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;

-- ============================================
-- DROP FUNCTIONS
-- ============================================

DROP FUNCTION IF EXISTS update_updated_at_column();

-- ============================================
-- DROP TABLES (in reverse order of dependencies)
-- ============================================

DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS referral_logs CASCADE;
DROP TABLE IF EXISTS points_log CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS user_vouchers CASCADE;
DROP TABLE IF EXISTS vouchers CASCADE;
DROP TABLE IF EXISTS user_packages CASCADE;
DROP TABLE IF EXISTS packages CASCADE;
DROP TABLE IF EXISTS stock_logs CASCADE;
DROP TABLE IF EXISTS string_inventory CASCADE;
DROP TABLE IF EXISTS verification_tokens CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- DROP EXTENSIONS (optional)
-- ============================================

-- Uncomment the line below if you want to drop the UUID extension
-- DROP EXTENSION IF EXISTS "uuid-ossp";

-- ============================================
-- VERIFICATION
-- ============================================

-- Run this query to verify all tables have been deleted:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- Result should be empty

-- ============================================
-- END OF CLEANUP SCRIPT
-- ============================================
