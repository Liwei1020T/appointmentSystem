/**
 * 创建测试管理员账户脚本
 * 运行: npx tsx scripts/create-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // 检查是否已存在管理员
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@example.com' },
    });

    if (existingAdmin) {
      console.log('✅ 管理员账户已存在:');
      console.log('   邮箱: admin@example.com');
      console.log('   角色:', existingAdmin.role);
      
      // 如果不是管理员角色，更新为管理员
      if (existingAdmin.role !== 'admin') {
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: { role: 'admin' },
        });
        console.log('   已更新为管理员角色');
      }
      return;
    }

    // 创建新的管理员账户
    const password = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        fullName: 'System Admin',
        phone: '+60123456789',
        password,
        role: 'admin',
        points: 0,
      },
    });

    console.log('✅ 管理员账户创建成功！');
    console.log('');
    console.log('📧 邮箱: admin@example.com');
    console.log('🔑 密码: admin123');
    console.log('👤 角色:', admin.role);
    console.log('');
    console.log('🌐 登录地址: http://localhost:3000/admin/login');
    console.log('');
    console.log('⚠️  请在生产环境中修改默认密码！');
  } catch (error) {
    console.error('❌ 创建管理员失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
