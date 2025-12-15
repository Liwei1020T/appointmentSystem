-- =====================================================
-- Migration 008: Admin Reports & Analytics
-- =====================================================
-- Purpose: Add database support for analytics and reporting
-- Date: 2025-12-11
-- Dependencies: Previous migrations (001-007)
-- =====================================================

-- =====================================================
-- 1. Add Indexes for Report Performance
-- =====================================================

-- Orders table indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_orders_created_at_status 
ON orders(created_at, status);

CREATE INDEX IF NOT EXISTS idx_orders_final_price_status 
ON orders(final_price, status) WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_orders_payment_method 
ON orders(payment_method) WHERE status = 'completed';

-- User packages for sales analytics
CREATE INDEX IF NOT EXISTS idx_user_packages_created_at 
ON user_packages(created_at);

CREATE INDEX IF NOT EXISTS idx_user_packages_package_id 
ON user_packages(package_id);

-- String inventory for product analytics
CREATE INDEX IF NOT EXISTS idx_string_inventory_cost 
ON string_inventory(cost_per_meter);

-- =====================================================
-- 2. Helper Functions for Analytics
-- =====================================================

-- Function: Get daily revenue for a date range
CREATE OR REPLACE FUNCTION get_daily_revenue(
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  date DATE,
  revenue DECIMAL(10,2),
  orders INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(o.created_at) as date,
    SUM(o.final_price)::DECIMAL(10,2) as revenue,
    COUNT(*)::INTEGER as orders
  FROM orders o
  WHERE o.created_at >= start_date
    AND o.created_at <= end_date + INTERVAL '1 day'
    AND o.status = 'completed'
  GROUP BY DATE(o.created_at)
  ORDER BY DATE(o.created_at);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get top selling strings
CREATE OR REPLACE FUNCTION get_top_strings(
  limit_count INTEGER DEFAULT 10,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  string_id UUID,
  string_name TEXT,
  quantity BIGINT,
  revenue DECIMAL(10,2),
  avg_tension DECIMAL(4,1)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.string_id,
    si.string_name,
    COUNT(*)::BIGINT as quantity,
    SUM(o.final_price)::DECIMAL(10,2) as revenue,
    AVG(o.tension)::DECIMAL(4,1) as avg_tension
  FROM orders o
  JOIN string_inventory si ON si.id = o.string_id
  WHERE o.status = 'completed'
    AND o.string_id IS NOT NULL
    AND (start_date IS NULL OR o.created_at >= start_date)
    AND (end_date IS NULL OR o.created_at <= end_date + INTERVAL '1 day')
  GROUP BY o.string_id, si.string_name
  ORDER BY quantity DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get top selling packages
CREATE OR REPLACE FUNCTION get_top_packages(
  limit_count INTEGER DEFAULT 10,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  package_id UUID,
  package_name TEXT,
  sold_count BIGINT,
  used_count BIGINT,
  revenue DECIMAL(10,2),
  utilization_rate DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH package_sales AS (
    SELECT 
      up.package_id,
      p.name as package_name,
      COUNT(*)::BIGINT as sold_count,
      SUM(p.price)::DECIMAL(10,2) as revenue
    FROM user_packages up
    JOIN packages p ON p.id = up.package_id
    WHERE (start_date IS NULL OR up.created_at >= start_date)
      AND (end_date IS NULL OR up.created_at <= end_date + INTERVAL '1 day')
    GROUP BY up.package_id, p.name
  ),
  package_usage AS (
    SELECT 
      o.package_id,
      COUNT(*)::BIGINT as used_count
    FROM orders o
    WHERE o.status = 'completed'
      AND o.package_id IS NOT NULL
      AND (start_date IS NULL OR o.created_at >= start_date)
      AND (end_date IS NULL OR o.created_at <= end_date + INTERVAL '1 day')
    GROUP BY o.package_id
  )
  SELECT 
    ps.package_id,
    ps.package_name,
    ps.sold_count,
    COALESCE(pu.used_count, 0)::BIGINT as used_count,
    ps.revenue,
    CASE 
      WHEN ps.sold_count > 0 THEN (COALESCE(pu.used_count, 0)::DECIMAL / ps.sold_count * 100)
      ELSE 0
    END::DECIMAL(5,2) as utilization_rate
  FROM package_sales ps
  LEFT JOIN package_usage pu ON pu.package_id = ps.package_id
  ORDER BY ps.sold_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get hourly order distribution
CREATE OR REPLACE FUNCTION get_hourly_order_distribution(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  hour INTEGER,
  order_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(HOUR FROM created_at)::INTEGER as hour,
    COUNT(*)::BIGINT as order_count
  FROM orders
  WHERE (start_date IS NULL OR created_at >= start_date)
    AND (end_date IS NULL OR created_at <= end_date + INTERVAL '1 day')
  GROUP BY EXTRACT(HOUR FROM created_at)
  ORDER BY hour;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get daily order distribution by day of week
CREATE OR REPLACE FUNCTION get_weekday_order_distribution(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  day_of_week INTEGER,
  order_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(DOW FROM created_at)::INTEGER as day_of_week,
    COUNT(*)::BIGINT as order_count
  FROM orders
  WHERE (start_date IS NULL OR created_at >= start_date)
    AND (end_date IS NULL OR created_at <= end_date + INTERVAL '1 day')
  GROUP BY EXTRACT(DOW FROM created_at)
  ORDER BY day_of_week;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get revenue by payment method
CREATE OR REPLACE FUNCTION get_revenue_by_payment_method(
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  payment_method TEXT,
  revenue DECIMAL(10,2),
  order_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(o.payment_method, 'unknown') as payment_method,
    SUM(o.final_price)::DECIMAL(10,2) as revenue,
    COUNT(*)::BIGINT as order_count
  FROM orders o
  WHERE o.created_at >= start_date
    AND o.created_at <= end_date + INTERVAL '1 day'
    AND o.status = 'completed'
  GROUP BY COALESCE(o.payment_method, 'unknown')
  ORDER BY revenue DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. Materialized Views for Dashboard Performance
-- =====================================================

-- View: Monthly revenue summary
CREATE MATERIALIZED VIEW IF NOT EXISTS monthly_revenue_summary AS
SELECT 
  DATE_TRUNC('month', created_at)::DATE as month,
  COUNT(*) as order_count,
  SUM(final_price) as total_revenue,
  AVG(final_price) as avg_order_value,
  SUM(CASE WHEN package_id IS NOT NULL THEN 1 ELSE 0 END) as orders_with_package,
  SUM(CASE WHEN voucher_id IS NOT NULL THEN 1 ELSE 0 END) as orders_with_voucher
FROM orders
WHERE status = 'completed'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_revenue_summary_month 
ON monthly_revenue_summary(month);

-- View: String performance summary
CREATE MATERIALIZED VIEW IF NOT EXISTS string_performance_summary AS
SELECT 
  si.id as string_id,
  si.string_name,
  si.brand,
  si.cost_per_meter,
  COUNT(o.id) as total_orders,
  SUM(o.final_price) as total_revenue,
  AVG(o.tension) as avg_tension,
  MIN(o.created_at) as first_order_date,
  MAX(o.created_at) as last_order_date
FROM string_inventory si
LEFT JOIN orders o ON o.string_id = si.id AND o.status = 'completed'
GROUP BY si.id, si.string_name, si.brand, si.cost_per_meter
ORDER BY total_orders DESC NULLS LAST;

CREATE UNIQUE INDEX IF NOT EXISTS idx_string_performance_summary_string_id 
ON string_performance_summary(string_id);

-- View: Package performance summary
CREATE MATERIALIZED VIEW IF NOT EXISTS package_performance_summary AS
SELECT 
  p.id as package_id,
  p.name as package_name,
  p.price,
  p.sessions_included,
  COUNT(DISTINCT up.id) as total_sold,
  COUNT(DISTINCT o.id) as total_used,
  SUM(p.price) as total_revenue,
  CASE 
    WHEN COUNT(DISTINCT up.id) > 0 
    THEN (COUNT(DISTINCT o.id)::DECIMAL / COUNT(DISTINCT up.id) * 100)
    ELSE 0 
  END as utilization_rate
FROM packages p
LEFT JOIN user_packages up ON up.package_id = p.id
LEFT JOIN orders o ON o.package_id = p.id AND o.status = 'completed'
WHERE p.is_active = true
GROUP BY p.id, p.name, p.price, p.sessions_included
ORDER BY total_sold DESC NULLS LAST;

CREATE UNIQUE INDEX IF NOT EXISTS idx_package_performance_summary_package_id 
ON package_performance_summary(package_id);

-- =====================================================
-- 4. Functions to Refresh Materialized Views
-- =====================================================

CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_revenue_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY string_performance_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY package_performance_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. Grant Permissions
-- =====================================================

-- Grant execution to authenticated users (admin only in practice via RLS)
GRANT EXECUTE ON FUNCTION get_daily_revenue TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_strings TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_packages TO authenticated;
GRANT EXECUTE ON FUNCTION get_hourly_order_distribution TO authenticated;
GRANT EXECUTE ON FUNCTION get_weekday_order_distribution TO authenticated;
GRANT EXECUTE ON FUNCTION get_revenue_by_payment_method TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_analytics_views TO authenticated;

-- Grant select on materialized views
GRANT SELECT ON monthly_revenue_summary TO authenticated;
GRANT SELECT ON string_performance_summary TO authenticated;
GRANT SELECT ON package_performance_summary TO authenticated;

-- =====================================================
-- 6. Comments for Documentation
-- =====================================================

COMMENT ON FUNCTION get_daily_revenue IS 'Returns daily revenue and order count for a date range';
COMMENT ON FUNCTION get_top_strings IS 'Returns top selling strings with revenue and average tension';
COMMENT ON FUNCTION get_top_packages IS 'Returns top selling packages with utilization metrics';
COMMENT ON FUNCTION get_hourly_order_distribution IS 'Returns order count by hour of day';
COMMENT ON FUNCTION get_weekday_order_distribution IS 'Returns order count by day of week';
COMMENT ON FUNCTION get_revenue_by_payment_method IS 'Returns revenue breakdown by payment method';
COMMENT ON FUNCTION refresh_analytics_views IS 'Refreshes all materialized views for analytics';

COMMENT ON MATERIALIZED VIEW monthly_revenue_summary IS 'Monthly aggregated revenue and order statistics';
COMMENT ON MATERIALIZED VIEW string_performance_summary IS 'Performance metrics for each string type';
COMMENT ON MATERIALIZED VIEW package_performance_summary IS 'Sales and utilization metrics for packages';

-- =====================================================
-- 7. Initial View Refresh
-- =====================================================

-- Populate the materialized views with initial data
SELECT refresh_analytics_views();

-- =====================================================
-- Migration Complete
-- =====================================================

-- Recommended: Schedule periodic refresh of materialized views
-- Create a cron job or scheduled function to run:
-- SELECT refresh_analytics_views();
-- Suggested frequency: Daily or after significant data changes
