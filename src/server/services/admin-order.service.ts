import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-errors';
import { isValidUUID } from '@/lib/utils';
import { getOrderQueuePosition } from '@/server/services/order-eta.service';

const ALLOWED_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'in_progress',
  'ready',
  'completed',
  'cancelled',
] as const;

type AdminOrderStatus = (typeof ALLOWED_STATUSES)[number];

function buildCreatedAtFilter(startDate?: string | null, endDate?: string | null) {
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
 * Fetch paginated admin order list.
 */
export async function getAdminOrders(params?: {
  status?: string;
  q?: string;
  page?: number;
  limit?: number;
}) {
  const status = params?.status;
  const search = params?.q;
  const page = params?.page ? Number(params.page) : 1;
  const limit = params?.limit ? Number(params.limit) : 20;
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
        items: {
          select: { id: true },
        },
      } as any,
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
 * Fetch a single order for admin view.
 */
export async function getAdminOrderById(orderId: string) {
  if (!isValidUUID(orderId)) {
    throw new ApiError('BAD_REQUEST', 400, 'Invalid order id');
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { id: true, email: true, fullName: true, phone: true } },
      string: true,
      payments: true,
      packageUsed: { include: { package: true } },
      voucherUsed: { include: { voucher: true } },
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
    } as any,
  });

  if (!order) {
    throw new ApiError('NOT_FOUND', 404, 'Order not found');
  }

  // 获取队列位置（仅对未完成订单）
  let queuePosition: number | null = null;
  if (order.status === 'pending' || order.status === 'in_progress') {
    queuePosition = await getOrderQueuePosition(orderId);
  }

  return { ...order, queuePosition };
}

/**
 * Update order status for admin.
 */
export async function updateAdminOrderStatus(
  orderId: string,
  status: AdminOrderStatus,
  notes?: string
) {
  if (!isValidUUID(orderId)) {
    throw new ApiError('BAD_REQUEST', 400, 'Invalid order id');
  }

  if (!status || !ALLOWED_STATUSES.includes(status)) {
    throw new ApiError('BAD_REQUEST', 400, 'Invalid order status');
  }

  const currentOrder = await prisma.order.findUnique({
    where: { id: orderId },
    select: { notes: true },
  });

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      // Preserve existing notes to avoid overwriting customer remarks.
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

/**
 * Update order estimated completion time (ETA).
 * Allows admin to manually override the system-calculated ETA.
 */
export async function updateOrderEta(
  orderId: string,
  estimatedCompletionAt: Date | null
) {
  if (!isValidUUID(orderId)) {
    throw new ApiError('BAD_REQUEST', 400, 'Invalid order id');
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      estimatedCompletionAt,
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

/**
 * Aggregate admin order stats.
 */
export async function getAdminOrderStats(params?: { startDate?: string | null; endDate?: string | null }) {
  const dateFilter = buildCreatedAtFilter(params?.startDate ?? null, params?.endDate ?? null);
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
