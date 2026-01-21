-- Migration: 017_package_tag_fields
-- Description: 添加套餐标签字段用于展示增强
-- Date: 2025-01-21

-- 添加套餐标签字段
ALTER TABLE packages
ADD COLUMN IF NOT EXISTS tag VARCHAR(50);

-- 添加热门套餐标记
ALTER TABLE packages
ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT FALSE;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_packages_tag ON packages(tag);

-- 更新现有套餐的标签（10次套餐标记为最受欢迎）
UPDATE packages
SET is_popular = TRUE, tag = 'most_popular'
WHERE times = 10;

-- 更新5次套餐为性价比之选
UPDATE packages
SET tag = 'best_value'
WHERE times = 5 AND tag IS NULL;

COMMENT ON COLUMN packages.tag IS '套餐标签: best_value, most_popular, limited_time, new';
COMMENT ON COLUMN packages.is_popular IS '是否为热门套餐';
