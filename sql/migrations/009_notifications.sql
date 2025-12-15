-- =====================================================
-- Migration 009: Notification System
-- =====================================================
-- Purpose: Add notification infrastructure for SMS and Push
-- Date: 2025-12-11
-- Dependencies: Previous migrations (001-008)
-- =====================================================

-- =====================================================
-- 1. Notification Templates Table
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('sms', 'push', 'both')),
  event_type TEXT NOT NULL, -- 'order_created', 'order_completed', 'payment_success', 'package_purchased', etc.
  
  -- Template content
  sms_content TEXT,
  push_title TEXT,
  push_body TEXT,
  
  -- Variables that can be used in templates
  -- Format: {{variable_name}}
  -- Available variables: {{user_name}}, {{order_id}}, {{amount}}, {{package_name}}, etc.
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default templates
INSERT INTO notification_templates (name, type, event_type, sms_content, push_title, push_body) VALUES
(
  'order_created',
  'both',
  'order_created',
  'Hi {{user_name}}! Your stringing order #{{order_id}} has been received. We will notify you when it''s ready. String Service Platform',
  'Order Received',
  'Your stringing order #{{order_id}} has been received and is being processed.'
),
(
  'order_completed',
  'both',
  'order_completed',
  'Hi {{user_name}}! Your racket is ready for pickup! Order #{{order_id}} completed. String Service Platform',
  'Racket Ready! 🎉',
  'Your order #{{order_id}} is complete. You can now pick up your racket!'
),
(
  'payment_success',
  'both',
  'payment_success',
  'Payment of RM {{amount}} received for order #{{order_id}}. Thank you! String Service Platform',
  'Payment Received',
  'Your payment of RM {{amount}} has been confirmed. Thank you!'
),
(
  'package_purchased',
  'both',
  'package_purchased',
  'Hi {{user_name}}! Your {{package_name}} has been activated. You have {{sessions}} sessions remaining. String Service Platform',
  'Package Activated! 🎁',
  'Your {{package_name}} is now active with {{sessions}} sessions.'
),
(
  'points_earned',
  'push',
  'points_earned',
  NULL,
  'Points Earned! ⭐',
  'You earned {{points}} points! Total: {{total_points}} points.'
),
(
  'voucher_received',
  'push',
  'voucher_received',
  NULL,
  'New Voucher! 🎟️',
  'You received a {{discount_value}} voucher. Code: {{voucher_code}}'
);

-- =====================================================
-- 2. User Devices Table (for Push Notifications)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Device information
  device_token TEXT NOT NULL, -- FCM token
  device_type TEXT NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
  device_name TEXT, -- e.g., "iPhone 13", "Samsung Galaxy S21"
  
  -- Metadata
  app_version TEXT,
  os_version TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, device_token)
);

-- =====================================================
-- 3. Notifications Log Table
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification details
  type TEXT NOT NULL CHECK (type IN ('sms', 'push')),
  event_type TEXT NOT NULL,
  
  -- Content
  title TEXT, -- For push notifications
  body TEXT NOT NULL,
  
  -- Recipient
  phone_number TEXT, -- For SMS
  device_token TEXT, -- For push
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  
  -- Provider info
  provider TEXT, -- 'twilio', 'fcm', etc.
  provider_message_id TEXT, -- External ID from provider
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Related records
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 4. Indexes for Performance
-- =====================================================

-- Notification templates
CREATE INDEX IF NOT EXISTS idx_notification_templates_event_type 
ON notification_templates(event_type) WHERE is_active = true;

-- User devices
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id 
ON user_devices(user_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_devices_device_token 
ON user_devices(device_token);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_status 
ON notifications(status);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_event_type 
ON notifications(event_type);

CREATE INDEX IF NOT EXISTS idx_notifications_order_id 
ON notifications(order_id) WHERE order_id IS NOT NULL;

-- =====================================================
-- 5. Triggers
-- =====================================================

-- Auto-update updated_at for notification_templates
CREATE OR REPLACE FUNCTION update_notification_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_templates_updated_at
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_template_updated_at();

-- Update device last_used_at when notifications are sent
CREATE OR REPLACE FUNCTION update_device_last_used()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'push' AND NEW.device_token IS NOT NULL THEN
    UPDATE user_devices
    SET last_used_at = NOW()
    WHERE device_token = NEW.device_token;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notifications_update_device_last_used
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_device_last_used();

-- =====================================================
-- 6. Helper Functions
-- =====================================================

-- Function: Get active devices for a user
CREATE OR REPLACE FUNCTION get_user_active_devices(user_uuid UUID)
RETURNS TABLE (
  device_id UUID,
  device_token TEXT,
  device_type TEXT,
  device_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id,
    user_devices.device_token,
    user_devices.device_type,
    user_devices.device_name
  FROM user_devices
  WHERE user_id = user_uuid
    AND is_active = true
  ORDER BY last_used_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get notification template
CREATE OR REPLACE FUNCTION get_notification_template(event_name TEXT)
RETURNS TABLE (
  template_id UUID,
  template_type TEXT,
  sms_content TEXT,
  push_title TEXT,
  push_body TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id,
    type,
    notification_templates.sms_content,
    notification_templates.push_title,
    notification_templates.push_body
  FROM notification_templates
  WHERE event_type = event_name
    AND is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get notification statistics
CREATE OR REPLACE FUNCTION get_notification_stats(days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_notifications BIGINT,
  sent_notifications BIGINT,
  failed_notifications BIGINT,
  sms_count BIGINT,
  push_count BIGINT,
  delivery_rate DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_notifications,
    COUNT(*) FILTER (WHERE status = 'sent' OR status = 'delivered')::BIGINT as sent_notifications,
    COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed_notifications,
    COUNT(*) FILTER (WHERE type = 'sms')::BIGINT as sms_count,
    COUNT(*) FILTER (WHERE type = 'push')::BIGINT as push_count,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE status = 'sent' OR status = 'delivered')::DECIMAL / COUNT(*) * 100)
      ELSE 0 
    END::DECIMAL(5,2) as delivery_rate
  FROM notifications
  WHERE created_at >= NOW() - (days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Clean up old inactive devices (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_inactive_devices()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_devices
  WHERE is_active = false
    AND last_used_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. Row Level Security (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notification Templates: Read-only for all authenticated users
CREATE POLICY notification_templates_select_all
  ON notification_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Notification Templates: Admin full access
CREATE POLICY notification_templates_all_for_admins
  ON notification_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'super_admin')
    )
  );

-- User Devices: Users can manage their own devices
CREATE POLICY user_devices_select_own
  ON user_devices FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY user_devices_insert_own
  ON user_devices FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY user_devices_update_own
  ON user_devices FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY user_devices_delete_own
  ON user_devices FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- User Devices: Admin full access
CREATE POLICY user_devices_all_for_admins
  ON user_devices FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'super_admin')
    )
  );

-- Notifications: Users can view their own notifications
CREATE POLICY notifications_select_own
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Notifications: Admin full access
CREATE POLICY notifications_all_for_admins
  ON notifications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- 8. Grant Permissions
-- =====================================================

GRANT SELECT ON notification_templates TO authenticated;
GRANT ALL ON user_devices TO authenticated;
GRANT SELECT ON notifications TO authenticated;

GRANT EXECUTE ON FUNCTION get_user_active_devices TO authenticated;
GRANT EXECUTE ON FUNCTION get_notification_template TO authenticated;
GRANT EXECUTE ON FUNCTION get_notification_stats TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_inactive_devices TO authenticated;

-- =====================================================
-- 9. Comments
-- =====================================================

COMMENT ON TABLE notification_templates IS 'Templates for SMS and Push notifications';
COMMENT ON TABLE user_devices IS 'User device tokens for push notifications (FCM)';
COMMENT ON TABLE notifications IS 'Log of all sent notifications';

COMMENT ON FUNCTION get_user_active_devices IS 'Get all active devices for a user';
COMMENT ON FUNCTION get_notification_template IS 'Get notification template by event type';
COMMENT ON FUNCTION get_notification_stats IS 'Get notification delivery statistics';
COMMENT ON FUNCTION cleanup_inactive_devices IS 'Remove old inactive devices';

-- =====================================================
-- Migration Complete
-- =====================================================

-- Verify tables created
SELECT 'Migration 009 complete. Tables created:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('notification_templates', 'user_devices', 'notifications');
