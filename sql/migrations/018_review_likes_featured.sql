-- Migration: 018_review_likes_featured
-- Description: 添加评价点赞和精选功能
-- Date: 2025-01-21

-- 添加精选标记字段
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- 添加点赞计数字段（冗余计数，提升查询性能）
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_reviews_is_featured ON reviews(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_reviews_likes_count ON reviews(likes_count DESC);

-- 创建评价点赞关联表
CREATE TABLE IF NOT EXISTS review_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(review_id, user_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_review_likes_review_id ON review_likes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_likes_user_id ON review_likes(user_id);

COMMENT ON TABLE review_likes IS '评价点赞关联表';
COMMENT ON COLUMN reviews.is_featured IS '是否为精选评价（管理员标记）';
COMMENT ON COLUMN reviews.likes_count IS '点赞数（冗余计数，提升查询性能）';
