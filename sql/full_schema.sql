-- String Service Platform — Full Supabase Schema Bootstrap
-- Version: 2025-12-12
-- This script creates all tables, indexes, RLS policies, and triggers
-- needed to run the completed application (orders, payments, packages,
-- vouchers, reviews, notifications, refunds, photos, inventory, points).
-- Run this against a fresh Supabase/PostgreSQL database.

-- ============================================================================
-- Extensions
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Helper functions
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code = UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT), 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Users
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  full_name TEXT,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by TEXT REFERENCES public.users(referral_code),
  points INTEGER NOT NULL DEFAULT 0,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON public.users(referred_by);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "Admins can view all users" ON public.users
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE TRIGGER trg_users_generate_referral
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_referral_code();

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.users IS 'User profiles extending Supabase Auth';

-- ============================================================================
-- String inventory
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.string_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  specification TEXT,
  string_name TEXT,
  color TEXT,
  gauge TEXT,
  price NUMERIC(10,2) NOT NULL,
  selling_price NUMERIC(10,2) GENERATED ALWAYS AS (price) STORED,
  cost_price NUMERIC(10,2) NOT NULL,
  cost_per_meter NUMERIC(10,2),
  stock INTEGER NOT NULL DEFAULT 0,
  stock_quantity INTEGER GENERATED ALWAYS AS (stock) STORED,
  minimum_stock INTEGER NOT NULL DEFAULT 5,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_string_inventory_active ON public.string_inventory(active);
CREATE INDEX IF NOT EXISTS idx_string_inventory_brand_model ON public.string_inventory(brand, model);
CREATE INDEX IF NOT EXISTS idx_string_inventory_stock ON public.string_inventory(stock);

ALTER TABLE public.string_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can view active inventory" ON public.string_inventory
  FOR SELECT USING (active = true);
CREATE POLICY IF NOT EXISTS "Only admins can modify inventory" ON public.string_inventory
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE TRIGGER trg_string_inventory_updated_at
  BEFORE UPDATE ON public.string_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Packages & user packages
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sessions_included INTEGER NOT NULL,
  times INTEGER GENERATED ALWAYS AS (sessions_included) STORED,
  price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  validity_days INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  remaining_sessions INTEGER NOT NULL,
  remaining INTEGER GENERATED ALWAYS AS (remaining_sessions) STORED,
  original_sessions INTEGER,
  expiry_date TIMESTAMPTZ NOT NULL,
  expiry TIMESTAMPTZ GENERATED ALWAYS AS (expiry_date) STORED,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'depleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_packages_active ON public.packages(active);
CREATE INDEX IF NOT EXISTS idx_user_packages_user_id ON public.user_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_user_packages_status ON public.user_packages(status);
CREATE INDEX IF NOT EXISTS idx_user_packages_expiry ON public.user_packages(expiry_date);

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Anyone can view active packages" ON public.packages
  FOR SELECT USING (active = true);
CREATE POLICY IF NOT EXISTS "Only admins can modify packages" ON public.packages
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE POLICY IF NOT EXISTS "Users can view own packages" ON public.user_packages
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Admins can view all packages" ON public.user_packages
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE TRIGGER trg_packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_user_packages_updated_at
  BEFORE UPDATE ON public.user_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Orders
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL DEFAULT (
    'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(gen_random_uuid()::TEXT, 1, 6)
  ),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  string_id UUID REFERENCES public.string_inventory(id),
  tension INTEGER,
  original_price NUMERIC(10,2) DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  final_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  price NUMERIC(10,2) GENERATED ALWAYS AS (final_price) STORED,
  cost NUMERIC(10,2),
  profit NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'pending_payment', 'in_progress', 'completed', 'cancelled')
  ),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (
    payment_status IN ('unpaid', 'pending_verification', 'paid', 'refunded', 'failed')
  ),
  payment_method TEXT,
  package_id UUID REFERENCES public.user_packages(id) ON DELETE SET NULL,
  package_used_id UUID GENERATED ALWAYS AS (package_id) STORED,
  voucher_id UUID,
  voucher_used_id UUID GENERATED ALWAYS AS (voucher_id) STORED,
  use_package BOOLEAN NOT NULL DEFAULT false,
  has_photos BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_string_id ON public.orders(string_id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Admins can manage all orders" ON public.orders
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Payments
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  provider TEXT CHECK (provider IN ('fpx', 'tng', 'stripe', 'card')) ,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'pending_verification', 'completed', 'failed', 'refunded')
  ),
  transaction_id TEXT UNIQUE,
  receipt_url TEXT,
  receipt_uploaded_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.users(id),
  verified_at TIMESTAMPTZ,
  admin_notes TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_pending_verification ON public.payments(status) WHERE status = 'pending_verification';

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Admins can view all payments" ON public.payments
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Vouchers
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('fixed_amount', 'percentage')),
  discount_type TEXT NOT NULL DEFAULT 'fixed' CHECK (discount_type IN ('fixed', 'percentage')),
  value NUMERIC(10,2) NOT NULL,
  discount_value NUMERIC(10,2) GENERATED ALWAYS AS (value) STORED,
  min_purchase NUMERIC(10,2) DEFAULT 0 NOT NULL,
  min_order_value NUMERIC(10,2) GENERATED ALWAYS AS (min_purchase) STORED,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  points_cost INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  voucher_id UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMPTZ,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  expiry TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK now that user_vouchers exists
ALTER TABLE public.orders
  ADD CONSTRAINT fk_orders_voucher_id
  FOREIGN KEY (voucher_id) REFERENCES public.user_vouchers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_vouchers_code ON public.vouchers(code);
CREATE INDEX IF NOT EXISTS idx_vouchers_active ON public.vouchers(active);
CREATE INDEX IF NOT EXISTS idx_user_vouchers_user_id ON public.user_vouchers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vouchers_status ON public.user_vouchers(status);

ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Anyone can view active vouchers" ON public.vouchers
  FOR SELECT USING (active = true AND valid_until > NOW());
CREATE POLICY IF NOT EXISTS "Only admins can modify vouchers" ON public.vouchers
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE POLICY IF NOT EXISTS "Users can view own vouchers" ON public.user_vouchers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Admins can view all user vouchers" ON public.user_vouchers
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- ============================================================================
-- Points, referrals, stock logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.points_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('order', 'referral', 'redeem', 'admin_grant')),
  reference_id UUID,
  description TEXT,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.referral_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  reward_given BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stock_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  string_id UUID NOT NULL REFERENCES public.string_inventory(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('restock', 'sale', 'adjustment', 'order_deduction', 'manual_deduction', 'return')),
  quantity_change INTEGER NOT NULL,
  quantity_before INTEGER,
  quantity_after INTEGER,
  cost_price NUMERIC(10,2),
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_points_log_user_id ON public.points_log(user_id);
CREATE INDEX IF NOT EXISTS idx_points_log_created_at ON public.points_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referral_logs_referrer_id ON public.referral_logs(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_logs_referred_id ON public.referral_logs(referred_id);
CREATE INDEX IF NOT EXISTS idx_stock_logs_string_id ON public.stock_logs(string_id);
CREATE INDEX IF NOT EXISTS idx_stock_logs_created_at ON public.stock_logs(created_at DESC);

ALTER TABLE public.points_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own points log" ON public.points_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Admins can view all points log" ON public.points_log
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY IF NOT EXISTS "Admins can view referral logs" ON public.referral_logs
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY IF NOT EXISTS "Admins can manage stock logs" ON public.stock_logs
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- ============================================================================
-- Notifications & preferences
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'order_created', 'order_confirmed', 'order_in_progress', 'order_completed', 'order_cancelled',
    'payment_pending', 'payment_verified', 'payment_rejected', 'refund_approved', 'refund_rejected',
    'refund_completed', 'low_stock', 'points_earned', 'voucher_received', 'package_purchased',
    'system_announcement', 'promo'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  action_url TEXT,
  channels JSONB NOT NULL DEFAULT '["in_app"]'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  metadata JSONB,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  email_order_updates BOOLEAN DEFAULT true,
  email_payment_updates BOOLEAN DEFAULT true,
  email_promotions BOOLEAN DEFAULT true,
  email_system BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  push_order_updates BOOLEAN DEFAULT true,
  push_payment_updates BOOLEAN DEFAULT true,
  push_promotions BOOLEAN DEFAULT false,
  push_system BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  sms_order_updates BOOLEAN DEFAULT false,
  sms_payment_updates BOOLEAN DEFAULT false,
  push_subscriptions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  provider TEXT,
  provider_message_id TEXT,
  error_message TEXT,
  reference_type TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  content JSONB
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_reference ON public.notifications(reference_type, reference_id) WHERE reference_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Admins can view all notifications" ON public.notifications
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY IF NOT EXISTS "Admins can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE POLICY IF NOT EXISTS "Users can manage own notification preferences" ON public.notification_preferences
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Admins can view all email logs" ON public.email_logs
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE TRIGGER trg_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_default_notification_preferences
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_notification_preferences();

-- ============================================================================
-- System settings
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Admins can manage system settings" ON public.system_settings
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

INSERT INTO public.system_settings (key, value, description) VALUES
  ('referral_reward', to_jsonb(50), 'Points for both referrer and referee'),
  ('low_stock_threshold', to_jsonb(5), 'Global low stock alert'),
  ('sms_enabled', to_jsonb(false), 'Enable SMS notifications')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- Refunds
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  refund_amount NUMERIC(10,2) NOT NULL CHECK (refund_amount > 0),
  original_amount NUMERIC(10,2) NOT NULL CHECK (original_amount > 0),
  refund_type TEXT NOT NULL CHECK (refund_type IN ('full', 'partial')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected', 'failed')),
  reason TEXT NOT NULL,
  admin_notes TEXT,
  failed_reason TEXT,
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMPTZ,
  processed_by UUID REFERENCES public.users(id),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  provider TEXT NOT NULL CHECK (provider IN ('tng', 'fpx', 'card', 'cash')),
  transaction_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON public.refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON public.refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_user_id ON public.refunds(user_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON public.refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_created_at ON public.refunds(created_at DESC);

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can view own refunds" ON public.refunds
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Admins can manage refunds" ON public.refunds
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE TRIGGER trg_refunds_updated_at
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Reviews
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  service_rating INTEGER NOT NULL CHECK (service_rating BETWEEN 1 AND 5),
  quality_rating INTEGER NOT NULL CHECK (quality_rating BETWEEN 1 AND 5),
  speed_rating INTEGER NOT NULL CHECK (speed_rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL CHECK (char_length(comment) >= 10),
  tags TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  admin_reply TEXT,
  admin_reply_at TIMESTAMPTZ,
  admin_reply_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (order_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_order_reviews_order_id ON public.order_reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_order_reviews_user_id ON public.order_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_order_reviews_rating ON public.order_reviews(rating DESC);
CREATE INDEX IF NOT EXISTS idx_order_reviews_created_at ON public.order_reviews(created_at DESC);

ALTER TABLE public.order_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can view reviews" ON public.order_reviews FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Users can create reviews for own orders" ON public.order_reviews
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid() AND o.status = 'completed'
    )
  );
CREATE POLICY IF NOT EXISTS "Users can update own reviews within 24h" ON public.order_reviews
  FOR UPDATE USING (auth.uid() = user_id AND created_at > NOW() - INTERVAL '24 hours');
CREATE POLICY IF NOT EXISTS "Users can delete own reviews within 1h" ON public.order_reviews
  FOR DELETE USING (auth.uid() = user_id AND created_at > NOW() - INTERVAL '1 hour');
CREATE POLICY IF NOT EXISTS "Admins can manage all reviews" ON public.order_reviews
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE OR REPLACE FUNCTION public.update_order_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_reviews_updated_at
  BEFORE UPDATE ON public.order_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_order_reviews_updated_at();

CREATE OR REPLACE FUNCTION public.award_review_points()
RETURNS TRIGGER AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE public.users SET points = points + 10 WHERE id = NEW.user_id RETURNING points INTO new_balance;
  INSERT INTO public.points_log (user_id, amount, type, reference_id, description, balance_after)
  VALUES (NEW.user_id, 10, 'order', NEW.order_id, '订单评价奖励', new_balance);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_award_review_points
  AFTER INSERT ON public.order_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.award_review_points();

-- ============================================================================
-- Order photos
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'after', 'detail', 'other')),
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  uploaded_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_photos_order_id ON public.order_photos(order_id);
CREATE INDEX IF NOT EXISTS idx_order_photos_created_at ON public.order_photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_photos_type ON public.order_photos(photo_type);

ALTER TABLE public.order_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can view own order photos" ON public.order_photos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
  );
CREATE POLICY IF NOT EXISTS "Admins can manage order photos" ON public.order_photos
  FOR ALL USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE OR REPLACE FUNCTION public.update_order_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_photos_updated_at
  BEFORE UPDATE ON public.order_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_order_photos_updated_at();

CREATE OR REPLACE FUNCTION public.update_order_has_photos()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.orders SET has_photos = true WHERE id = NEW.order_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.orders
    SET has_photos = (SELECT COUNT(*) > 0 FROM public.order_photos WHERE order_id = OLD.order_id)
    WHERE id = OLD.order_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_order_photos_update_flag
  AFTER INSERT OR DELETE ON public.order_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_order_has_photos();

-- ============================================================================
-- Business logic triggers
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_referral_reward()
RETURNS TRIGGER AS $$
DECLARE
  referrer_user_id UUID;
  reward_points INTEGER := 50;
  new_balance INTEGER;
BEGIN
  IF NEW.referred_by IS NOT NULL THEN
    SELECT id INTO referrer_user_id FROM public.users WHERE referral_code = NEW.referred_by;
    IF referrer_user_id IS NOT NULL THEN
      UPDATE public.users SET points = points + reward_points WHERE id = referrer_user_id RETURNING points INTO new_balance;
      INSERT INTO public.points_log (user_id, amount, type, balance_after, description)
      VALUES (referrer_user_id, reward_points, 'referral', new_balance, 'Referral reward');

      UPDATE public.users SET points = points + reward_points WHERE id = NEW.id RETURNING points INTO new_balance;
      INSERT INTO public.points_log (user_id, amount, type, balance_after, description)
      VALUES (NEW.id, reward_points, 'referral', new_balance, 'Welcome bonus');

      INSERT INTO public.referral_logs (referrer_id, referred_id, referral_code, reward_given)
      VALUES (referrer_user_id, NEW.id, NEW.referred_by, true);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_process_referral_reward
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.process_referral_reward();

CREATE OR REPLACE FUNCTION public.process_order_completion()
RETURNS TRIGGER AS $$
DECLARE
  points_to_award INTEGER := GREATEST(0, FLOOR(COALESCE(NEW.final_price, 0) * 0.5));
  new_balance INTEGER;
  string_cost NUMERIC(10,2);
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    NEW.completed_at = NOW();

    -- Fetch cost and update profit
    SELECT cost_price INTO string_cost FROM public.string_inventory WHERE id = NEW.string_id;
    NEW.cost = string_cost;
    NEW.profit = NEW.final_price - COALESCE(NEW.cost, 0);

    -- Deduct inventory
    IF NEW.string_id IS NOT NULL THEN
      UPDATE public.string_inventory SET stock = stock - 1 WHERE id = NEW.string_id;
      INSERT INTO public.stock_logs (string_id, type, quantity_change, quantity_before, quantity_after, reference_id, cost_price)
      SELECT NEW.string_id, 'order_deduction', -1, stock + 1, stock, NEW.id, string_cost
      FROM public.string_inventory WHERE id = NEW.string_id;
    END IF;

    -- Award points based on order amount (percentage-based)
    UPDATE public.users SET points = points + points_to_award WHERE id = NEW.user_id RETURNING points INTO new_balance;
    INSERT INTO public.points_log (user_id, amount, type, reference_id, balance_after, description)
    VALUES (NEW.user_id, points_to_award, 'order', NEW.id, new_balance, 'Order completed');

    -- Notify user
    INSERT INTO public.notifications (user_id, type, title, message, reference_type, reference_id, action_url, channels, priority)
    VALUES (
      NEW.user_id,
      'order_completed',
      '订单已完成',
      '您的球拍穿线已完成，欢迎取拍。',
      'order',
      NEW.id,
      '/orders/' || NEW.id::TEXT,
      '["in_app"]',
      'normal'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_process_order_completion
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.process_order_completion();

CREATE OR REPLACE FUNCTION public.update_package_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.remaining_sessions <= 0 AND NEW.status = 'active' THEN
    NEW.status = 'depleted';
  ELSIF NEW.expiry_date < NOW() AND NEW.status = 'active' THEN
    NEW.status = 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_package_status
  BEFORE UPDATE ON public.user_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_package_status();

-- ============================================================================
-- Utility RPCs for analytics
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_review_stats()
RETURNS TABLE (
  total_reviews BIGINT,
  average_rating NUMERIC,
  rating_5 BIGINT,
  rating_4 BIGINT,
  rating_3 BIGINT,
  rating_2 BIGINT,
  rating_1 BIGINT,
  avg_service NUMERIC,
  avg_quality NUMERIC,
  avg_speed NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    ROUND(AVG(rating), 2),
    COUNT(*) FILTER (WHERE rating = 5)::BIGINT,
    COUNT(*) FILTER (WHERE rating = 4)::BIGINT,
    COUNT(*) FILTER (WHERE rating = 3)::BIGINT,
    COUNT(*) FILTER (WHERE rating = 2)::BIGINT,
    COUNT(*) FILTER (WHERE rating = 1)::BIGINT,
    ROUND(AVG(service_rating), 2),
    ROUND(AVG(quality_rating), 2),
    ROUND(AVG(speed_rating), 2)
  FROM public.order_reviews;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_top_review_tags(limit_count INT DEFAULT 10)
RETURNS TABLE (tag TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT UNNEST(tags) AS tag, COUNT(*) AS count
  FROM public.order_reviews
  WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
  GROUP BY tag
  ORDER BY count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
