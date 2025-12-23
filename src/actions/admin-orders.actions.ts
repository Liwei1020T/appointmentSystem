'use server';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { isValidUUID } from '@/lib/utils';

/**
 * 管理员 - 获取订单列表
 */
export async function getAdminOrdersAction(options?: {
  status?: string;
  q?: string;
  page?: number;
  limit?: number;
}) {
  await requireAdmin();
  const status = options?.status;
  const search = options?.q;
  const page = options?.page ? Number(options.page) : 1;
  const limit = options?.limit ? Number(options.limit) : 20;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { id: { contains: search, mode: 'insensitive' } },
      { user: { fullName: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { user: { phone: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, fullName: true, phone: true } },
        string: true,
        payments: true,
        packageUsed: { include: { package: true } },
        voucherUsed: { include: { voucher: true } },
        // Include items for multi-racket order list display
        items: {
          select: { id: true },
        },
      } as any, // Dynamic include until Prisma client is regenerated
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * 管理员 - 获取订单详情
 */
export async function getAdminOrderByIdAction(orderId: string) {
  await requireAdmin();

  if (!isValidUUID(orderId)) {
    throw new Error('无效的订单编号');
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { id: true, email: true, fullName: true, phone: true } },
      string: true,
      payments: true,
      packageUsed: { include: { package: true } },
      voucherUsed: { include: { voucher: true } },
      // Multi-racket support: include order items with string info
      items: {
        include: {
          string: {
            select: {
              id: true,
              brand: true,
              model: true,
              sellingPrice: true,
            },
          },
        },
      },
    } as any, // Dynamic include until Prisma client is regenerated
  });

  if (!order) {
    throw new Error('订单不存在');
  }

  return order;
}

const ALLOWED_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'in_progress',
  'ready',
  'completed',
  'cancelled',
] as const;

/**
 * 管理员 - 更新订单状态
 */
export async function updateAdminOrderStatusAction(orderId: string, status: string, notes?: string) {
  await requireAdmin();

  if (!isValidUUID(orderId)) {
    throw new Error('无效的订单编号');
  }

  if (!status || !ALLOWED_STATUSES.includes(status as any)) {
    throw new Error('无效的订单状态');
  }

  const currentOrder = await prisma.order.findUnique({
    where: { id: orderId },
    select: { notes: true },
  });

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      notes: currentOrder?.notes,
    },
    include: {
      user: { select: { id: true, email: true, fullName: true, phone: true } },
      string: true,
      payments: true,
      packageUsed: { include: { package: true } },
      voucherUsed: { include: { voucher: true } },
    },
  });

  return order;
}

function buildCreatedAtFilter(startDate: string | null, endDate: string | null) {
  if (!startDate || !endDate) return undefined;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return undefined;
  return { gte: start, lte: end };
}

function getTodayRange() {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  return { startOfToday, now };
}

/**
 * 管理员 - 订单统计
 */
export async function getAdminOrderStatsAction(options?: { startDate?: string | null; endDate?: string | null }) {
  await requireAdmin();
  const dateFilter = buildCreatedAtFilter(options?.startDate ?? null, options?.endDate ?? null);
  const { startOfToday, now } = getTodayRange();

  const [total, pending, confirmed, inProgress, completed, cancelled, revenueAgg, todayTotal, todayRevenueAgg] =
    await Promise.all([
      prisma.order.count({ where: { ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
      prisma.order.count({ where: { status: 'pending', ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
      prisma.order.count({ where: { status: 'confirmed', ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
      prisma.order.count({ where: { status: 'in_progress', ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
      prisma.order.count({ where: { status: 'completed', ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
      prisma.order.count({ where: { status: 'cancelled', ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
      prisma.order.aggregate({
        _sum: { price: true },
        where: { status: 'completed', ...(dateFilter ? { createdAt: dateFilter } : {}) },
      }),
      prisma.order.count({ where: { createdAt: { gte: startOfToday, lte: now } } }),
      prisma.order.aggregate({
        _sum: { price: true },
        where: { createdAt: { gte: startOfToday, lte: now }, NOT: { status: 'cancelled' } },
      }),
    ]);

  const revenue = Number(revenueAgg._sum?.price || 0);
  const todayRevenue = Number(todayRevenueAgg._sum?.price || 0);

  return {
    total,
    pending,
    confirmed,
    in_progress: inProgress,
    completed,
    cancelled,
    revenue,
    todayTotal,
    todayRevenue,
  };
}
