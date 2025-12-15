// 快速创建管理员账户
// 运行: node scripts/quick-admin.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@example.com';
  const password = 'admin123';
  
  console.log('🔄 创建管理员账户...');
  
  try {
    // 检查是否已存在
    let user = await prisma.user.findUnique({
      where: { email }
    });

    const passwordHash = await bcrypt.hash(password, 10);

    if (user) {
      // 更新现有用户
      user = await prisma.user.update({
        where: { email },
        data: {
          role: 'admin',
          passwordHash: passwordHash
        }
      });
      console.log('✅ 已将现有用户更新为管理员');
    } else {
      // 创建新用户
      user = await prisma.user.create({
        data: {
          email: email,
          fullName: 'System Admin',
          phone: '+60123456789',
          passwordHash: passwordHash,
          role: 'admin',
          pointsBalance: 0
        }
      });
      console.log('✅ 管理员账户创建成功！');
    }

    console.log('\n📧 邮箱: admin@example.com');
    console.log('🔑 密码: admin123');
    console.log('🌐 登录: http://localhost:3000/admin/login\n');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
