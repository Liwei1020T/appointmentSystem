'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';

/**
 * 获取可用套餐（Server Action）
 */
export async function getAvailablePackagesAction() {
  return prisma.package.findMany({
    where: { active: true },
    orderBy: { price: 'asc' },
  });
}

/**
 * 获取精选套餐（Server Action）
 */
export async function getFeaturedPackagesAction(limit = 3) {
  return prisma.package.findMany({
    where: { active: true },
    orderBy: [{ price: 'asc' }],
    take: limit,
  });
}

/**
 * 获取用户套餐（Server Action）
 */
export async function getUserPackagesAction(status?: string) {
  const user = await requireAuth();
  return prisma.userPackage.findMany({
    where: {
      userId: user.id,
      ...(status ? { status } : {}),
    },
    include: { package: true },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * 购买套餐（Server Action）
 */
export async function buyPackageAction(payload: { packageId: string; paymentMethod?: string }) {
  const user = await requireAuth();
  const { packageId, paymentMethod = 'tng' } = payload;

  if (!packageId) {
    throw new Error('缺少套餐 ID');
  }

  const normalizedProvider = paymentMethod === 'cash' ? 'cash' : 'tng';

  const packageData = await prisma.package.findUnique({
    where: { id: packageId },
  });

  if (!packageData) {
    throw new Error('套餐不存在');
  }

  if (!packageData.active) {
    throw new Error('套餐已下架');
  }

  if (Number(packageData.price) <= 0) {
    throw new Error('套餐价格无效');
  }

  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      packageId: packageData.id,
      amount: packageData.price,
      provider: normalizedProvider,
      status: 'pending',
      metadata: {
        type: 'package',
        paymentMethod: normalizedProvider,
        createdAt: new Date().toISOString(),
        note:
          normalizedProvider === 'cash'
            ? '客户选择现金购买套餐，等待管理员确认收款'
            : '客户选择 TNG 扫码购买套餐，等待上传收据并由管理员审核',
      },
    },
  });

  return {
    paymentId: payment.id,
    packageId: packageData.id,
    packageName: packageData.name,
    amount: Number(packageData.price),
    times: packageData.times,
    validityDays: packageData.validityDays,
    paymentRequired: true,
    paymentMethod: normalizedProvider,
  };
}

/**
 * 用户套餐（Profile UI 结构）
 */
export async function getUserPackagesForProfileAction() {
  const user = await requireAuth();
  const userPackages = await prisma.userPackage.findMany({
    where: { userId: user.id },
    include: { package: true },
    orderBy: { createdAt: 'desc' },
  });

  return userPackages.map((pkg) => ({
    id: pkg.id,
    package_id: pkg.packageId,
    remaining_uses: pkg.remaining,
    expiry_date: pkg.expiry.toISOString(),
    created_at: pkg.createdAt.toISOString(),
    package: {
      id: pkg.package.id,
      name: pkg.package.name,
      total_uses: pkg.package.times,
      price: Number(pkg.package.price),
      validity_days: pkg.package.validityDays,
    },
  }));
}

/**
 * 套餐使用记录（Profile UI 结构）
 */
export async function getPackageUsageAction(userPackageId: string) {
  const user = await requireAuth();

  const pkg = await prisma.userPackage.findFirst({
    where: { id: userPackageId, userId: user.id },
  });

  if (!pkg) {
    throw new Error('套餐不存在');
  }

  const orders = await prisma.order.findMany({
    where: { packageUsedId: userPackageId },
    orderBy: { createdAt: 'desc' },
    include: {
      string: {
        select: { brand: true, model: true },
      },
    },
  });

  return orders.map((order) => ({
    id: order.id,
    used_at: order.createdAt.toISOString(),
    order: {
      order_number: order.id.slice(0, 8),
      string: {
        brand: order.string?.brand || '',
        model: order.string?.model || '',
      },
    },
  }));
}
