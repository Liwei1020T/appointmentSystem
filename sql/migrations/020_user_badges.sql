-- Migration: 020_user_badges
-- Description: 添加用户徽章表（阶梯式推荐奖励系统）
-- Date: 2026-01-21

-- 创建用户徽章表
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 每用户每徽章类型只能获得一次
  UNIQUE(user_id, badge_type)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_type ON user_badges(badge_type);

-- 添加注释
COMMENT ON TABLE user_badges IS '用户徽章表，记录用户获得的成就徽章';
COMMENT ON COLUMN user_badges.badge_type IS '徽章类型: referral_bronze, referral_silver, referral_gold, review_master, vip_customer, first_order';
