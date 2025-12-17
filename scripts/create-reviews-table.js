// 在数据库中创建 reviews 表
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createReviewsTable() {
  try {
    console.log('开始创建 reviews 表...');
    
    // 创建 reviews 表
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL UNIQUE,
        user_id UUID NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        photos TEXT[] DEFAULT '{}',
        created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT fk_review_order FOREIGN KEY (order_id) 
          REFERENCES orders(id) ON DELETE CASCADE,
        CONSTRAINT fk_review_user FOREIGN KEY (user_id) 
          REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ reviews 表创建成功');

    // 创建索引
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id)
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating)
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at)
    `);
    console.log('✓ 索引创建成功');

    // 创建更新触发器
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION update_reviews_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    
    await prisma.$executeRawUnsafe(`
      DROP TRIGGER IF EXISTS trigger_reviews_updated_at ON reviews
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER trigger_reviews_updated_at
        BEFORE UPDATE ON reviews
        FOR EACH ROW
        EXECUTE FUNCTION update_reviews_updated_at()
    `);
    console.log('✓ 触发器创建成功');

    console.log('\n✅ reviews 表创建完成！');
    console.log('现在请重启开发服务器，然后刷新页面。');
    
  } catch (error) {
    console.error('❌ 创建表时出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createReviewsTable();
