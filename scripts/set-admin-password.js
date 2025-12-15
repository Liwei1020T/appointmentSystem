// 更新管理员密码
// 运行: node scripts/set-admin-password.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@example.com';
  const password = 'admin123';
  
  console.log('🔄 生成密码hash...');
  const passwordHash = await bcrypt.hash(password, 10);
  console.log('Hash生成完成:', passwordHash.substring(0, 20) + '...');
  
  console.log('\n🔄 更新管理员密码...');
  
  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: passwordHash,
        role: 'admin'
      },
      create: {
        email: email,
        fullName: 'System Admin',
        phone: '+60123456789',
        password: passwordHash,
        role: 'admin',
        points: 0
      }
    });

    console.log('\n✅ 管理员账户已准备就绪！\n');
    console.log('📧 邮箱: admin@example.com');
    console.log('🔑 密码: admin123');
    console.log('👤 角色:', user.role);
    console.log('\n🌐 登录地址: http://localhost:3000/admin/login\n');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
