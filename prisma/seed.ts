/**
 * Prisma Seed Script
 * 使用 TypeScript 初始化数据库
 * 运行: npx prisma db seed
 */

import { PrismaClient } from '.prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据库...');

  // 1. 创建管理员
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@string.com' },
    update: {},
    create: {
      email: 'admin@string.com',
      password: adminPassword,
      fullName: '系统管理员',
      role: 'admin',
      points: 0,
    },
  });
  console.log('✓ 创建管理员账号:', admin.email);

  // 2. 创建系统设置
  await prisma.systemSetting.upsert({
    where: { key: 'referral_reward' },
    update: { value: 50 },
    create: {
      key: 'referral_reward',
      value: 50,
      description: '推荐奖励积分数',
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'low_stock_threshold' },
    update: { value: 5 },
    create: {
      key: 'low_stock_threshold',
      value: 5,
      description: '低库存警告阈值（米）',
    },
  });
  console.log('✓ 创建系统设置');

  // 3. 创建套餐
  const packages = [
    {
      name: '体验套餐',
      description: '适合新手体验',
      times: 3,
      price: 90.00,
      originalPrice: 105.00,
      validityDays: 30,
    },
    {
      name: '基础套餐',
      description: '适合普通玩家',
      times: 5,
      price: 140.00,
      originalPrice: 175.00,
      validityDays: 60,
    },
    {
      name: '高级套餐',
      description: '适合高频玩家',
      times: 10,
      price: 260.00,
      originalPrice: 350.00,
      validityDays: 90,
    },
    {
      name: '年度套餐',
      description: '最超值选择',
      times: 20,
      price: 480.00,
      originalPrice: 700.00,
      validityDays: 365,
    },
  ];

  for (const pkg of packages) {
    await prisma.package.create({
      data: pkg,
    });
  }
  console.log(`✓ 创建 ${packages.length} 个套餐`);

  // 4. 创建球线库存
  const strings = [
    {
      model: 'BG66 Ultimax',
      brand: 'YONEX',
      costPrice: 25.00,
      sellingPrice: 35.00,
      stock: 100,
      minimumStock: 20,
      color: '白色',
      gauge: '0.65mm',
    },
    {
      model: 'NBG98',
      brand: 'YONEX',
      costPrice: 28.00,
      sellingPrice: 38.00,
      stock: 80,
      minimumStock: 20,
      color: '黄色',
      gauge: '0.66mm',
    },
    {
      model: 'Aerobite',
      brand: 'YONEX',
      costPrice: 32.00,
      sellingPrice: 42.00,
      stock: 60,
      minimumStock: 15,
      color: '白/蓝',
      gauge: '0.67/0.61mm',
    },
    {
      model: 'HiQua Ultra',
      brand: 'Li-Ning',
      costPrice: 22.00,
      sellingPrice: 32.00,
      stock: 120,
      minimumStock: 25,
      color: '白色',
      gauge: '0.67mm',
    },
    {
      model: 'No.1 Turbo',
      brand: 'Li-Ning',
      costPrice: 25.00,
      sellingPrice: 35.00,
      stock: 90,
      minimumStock: 20,
      color: '金色',
      gauge: '0.68mm',
    },
  ];

  for (const string of strings) {
    await prisma.stringInventory.create({
      data: string,
    });
  }
  console.log(`✓ 创建 ${strings.length} 个球线库存`);

  // 5. 创建优惠券
  const validFrom = new Date();
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 90);

  const vouchers = [
    {
      code: 'WELCOME10',
      name: '新用户优惠',
      type: 'fixed_amount',
      value: 10.00,
      minPurchase: 30.00,
      maxUses: 100,
      pointsCost: 0,
      validFrom,
      validUntil,
    },
    {
      code: 'SAVE20',
      name: '满减20',
      type: 'fixed_amount',
      value: 20.00,
      minPurchase: 100.00,
      pointsCost: 50,
      validFrom,
      validUntil,
    },
    {
      code: 'VIP15',
      name: '会员专享85折',
      type: 'percentage',
      value: 15.00,
      minPurchase: 50.00,
      pointsCost: 100,
      validFrom,
      validUntil,
    },
  ];

  for (const voucher of vouchers) {
    await prisma.voucher.upsert({
      where: { code: voucher.code },
      update: {},
      create: voucher,
    });
  }
  console.log(`✓ 创建 ${vouchers.length} 个优惠券`);

  console.log('\n✅ 数据库初始化完成！');
  console.log('\n默认管理员账号:');
  console.log('  邮箱: admin@string.com');
  console.log('  密码: admin123');
  console.log('\n⚠️  请在生产环境中修改默认密码！');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
