-- =====================================================
-- SMS Notification System Migration
-- Created: 2025-01-12
-- Purpose: Add SMS templates and logs tables
-- =====================================================

-- 1. SMS Templates Table
CREATE TABLE IF NOT EXISTS sms_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT sms_templates_content_check CHECK (length(content) > 0)
);

-- 2. SMS Logs Table
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, sent, failed, delivered
  provider VARCHAR(50) DEFAULT 'twilio',
  provider_message_id VARCHAR(255),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP,
  
  CONSTRAINT sms_logs_status_check CHECK (status IN ('pending', 'sent', 'failed', 'delivered'))
);

-- 3. Add phone field to users table (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- 4. Add SMS preferences to notification_preferences
ALTER TABLE notification_preferences 
  ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS sms_order_updates BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS sms_payment_updates BOOLEAN DEFAULT true;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_sms_logs_user_id ON sms_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON sms_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_templates_event_type ON sms_templates(event_type);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 6. Insert Default SMS Templates (Malaysian English)
INSERT INTO sms_templates (event_type, content, description, is_active) VALUES
  (
    'order_created',
    'Hi {{user_name}}! Your String booking #{{order_number}} has been received. We''ll notify you once it''s ready. Thanks!',
    'Sent when order is created',
    true
  ),
  (
    'order_completed',
    'Hi {{user_name}}! Your String order #{{order_number}} is ready for pickup! Please collect it at your convenience. Thank you!',
    'Sent when order is completed',
    true
  ),
  (
    'payment_verified',
    'Payment confirmed! Your String order #{{order_number}} is being processed. Total: RM{{amount}}. Thanks!',
    'Sent when payment is verified',
    true
  ),
  (
    'package_purchased',
    'Hi {{user_name}}! Your package "{{package_name}}" has been activated. Enjoy {{credit_amount}} credits! 🎾',
    'Sent when package is purchased',
    true
  ),
  (
    'points_earned',
    'You earned {{points}} points! Your total: {{total_points}} points. Redeem for vouchers anytime! 🌟',
    'Sent when user earns points',
    true
  ),
  (
    'voucher_received',
    'New voucher unlocked! {{voucher_name}} - {{discount}}% off. Use code: {{code}}. Valid until {{expiry}}.',
    'Sent when user receives voucher',
    true
  ),
  (
    'low_stock_alert',
    'Alert: {{string_name}} is running low ({{quantity}} left). Please restock soon.',
    'Admin notification for low inventory',
    true
  )
ON CONFLICT (event_type) DO NOTHING;

-- 7. RLS Policies
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;

-- Users can view their own SMS logs
CREATE POLICY "Users can view own SMS logs"
  ON sms_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Admin can view all SMS logs
CREATE POLICY "Admins can view all SMS logs"
  ON sms_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

-- Service role can insert SMS logs
CREATE POLICY "Service role can insert SMS logs"
  ON sms_logs FOR INSERT
  WITH CHECK (true);

-- Service role can update SMS logs (delivery status)
CREATE POLICY "Service role can update SMS logs"
  ON sms_logs FOR UPDATE
  USING (true);

-- Everyone can read active SMS templates (for preview)
CREATE POLICY "Public can read SMS templates"
  ON sms_templates FOR SELECT
  USING (is_active = true);

-- Only admins can modify SMS templates
CREATE POLICY "Admins can manage SMS templates"
  ON sms_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.is_admin = true
    )
  );

-- 8. Updated At Trigger
CREATE OR REPLACE FUNCTION update_sms_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sms_templates_updated_at
  BEFORE UPDATE ON sms_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_sms_template_updated_at();

-- 9. Create function to get SMS stats
CREATE OR REPLACE FUNCTION get_sms_stats(
  start_date TIMESTAMP DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMP DEFAULT NOW()
)
RETURNS TABLE (
  total_sent BIGINT,
  total_delivered BIGINT,
  total_failed BIGINT,
  delivery_rate NUMERIC,
  total_cost NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status IN ('sent', 'delivered')) AS total_sent,
    COUNT(*) FILTER (WHERE status = 'delivered') AS total_delivered,
    COUNT(*) FILTER (WHERE status = 'failed') AS total_failed,
    ROUND(
      CAST(COUNT(*) FILTER (WHERE status = 'delivered') AS NUMERIC) / 
      NULLIF(COUNT(*) FILTER (WHERE status IN ('sent', 'delivered')), 0) * 100,
      2
    ) AS delivery_rate,
    -- Twilio Malaysia: ~RM 0.30 per SMS
    ROUND(COUNT(*) FILTER (WHERE status IN ('sent', 'delivered')) * 0.30, 2) AS total_cost
  FROM sms_logs
  WHERE created_at BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE sms_templates IS 'SMS message templates for different events';
COMMENT ON TABLE sms_logs IS 'Log of all SMS messages sent';
COMMENT ON FUNCTION get_sms_stats IS 'Get SMS delivery statistics and cost estimation';
