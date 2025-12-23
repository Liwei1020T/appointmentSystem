'use server';

import { prisma } from '@/lib/prisma';
import { requireAdmin, requireAuth } from '@/lib/server-auth';
import { isValidUUID } from '@/lib/utils';

export interface CreateOrderPayload {
  string_id?: string;
  stringId?: string;
  tension: number;
  price?: number;
  cost_price?: number;
  costPrice?: number;
  discount_amount?: number;
  discountAmount?: number;
  final_price?: number;
  finalPrice?: number;
  use_package?: boolean;
  usePackage?: boolean;
  voucher_id?: string | null;
  voucherId?: string | null;
  notes?: string;
}

export interface CreateOrderWithPackagePayload {
  stringId: string;
  tension: number;
  usePackage?: boolean;
  packageId?: string;
  voucherId?: string;
  notes?: string;
}

// New: Multi-racket order item
export interface OrderItemPayload {
  stringId: string;
  tensionVertical: number;
  tensionHorizontal: number;
  racketBrand?: string;
  racketModel?: string;
  racketPhoto: string;  // Required
  notes?: string;
}

// New: Multi-racket order payload
export interface CreateMultiRacketOrderPayload {
  items: OrderItemPayload[];
  usePackage?: boolean;
  packageId?: string;
  voucherId?: string;
  notes?: string;
}


/**
 * 获取当前用户订单列表（Server Action）
 */
export async function getUserOrdersAction(options?: {
  status?: string;
  limit?: number;
  page?: number;
}) {
  const user = await requireAuth();
  const status = options?.status;
  const limit = options?.limit;
  const page = options?.page;
  const take = limit ? Number(limit) : undefined;
  const skip = page && take ? (Number(page) - 1) * take : undefined;

  const orders = await prisma.order.findMany({
    where: {
      userId: user.id,
      ...(status ? { status } : {}),
    },
    include: {
      string: {
        select: {
          id: true,
          brand: true,
          model: true,
          sellingPrice: true,
        },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          status: true,
          provider: true,
          transactionId: true,
          createdAt: true,
        },
      },
      // Include items for multi-racket order display
      items: {
        select: { id: true },
      },
    } as any, // Dynamic include until Prisma client is regenerated
    orderBy: { createdAt: 'desc' },
    ...(take ? { take } : {}),
    ...(skip !== undefined ? { skip } : {}),
  });

  return orders;
}

/**
 * 获取订单详情（Server Action）
 */
export async function getOrderByIdAction(orderId: string) {
  const user = await requireAuth();

  if (!isValidUUID(orderId)) {
    throw new Error('无效的订单编号');
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
    include: {
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
    } as any, // Dynamic include for items until Prisma client is regenerated
  });

  if (!order) {
    throw new Error('订单不存在');
  }

  return order;
}

/**
 * 创建订单（BookingFlow 使用）
 */
export async function createOrderAction(payload: CreateOrderPayload) {
  const user = await requireAuth();

  const stringId = payload.string_id || payload.stringId;
  const tension = payload.tension;
  const finalPrice = payload.final_price ?? payload.finalPrice;
  const costPrice = payload.cost_price ?? payload.costPrice;
  const discountAmount = payload.discount_amount ?? payload.discountAmount ?? 0;
  const usePackage = payload.use_package ?? payload.usePackage ?? false;
  const voucherId = payload.voucher_id ?? payload.voucherId ?? null;
  const notes = payload.notes ?? '';

  if (!stringId || !tension || finalPrice === undefined) {
    throw new Error('缺少必填字段');
  }

  const string = await prisma.stringInventory.findUnique({
    where: { id: stringId },
  });

  if (!string) {
    throw new Error('球线不存在');
  }

  if (string.stock <= 0) {
    throw new Error('球线库存不足');
  }

  let packageUsed = null;
  if (usePackage) {
    const availablePackage = await prisma.userPackage.findFirst({
      where: {
        userId: user.id,
        remaining: { gt: 0 },
        expiry: { gt: new Date() },
        status: 'active',
      },
      orderBy: { expiry: 'asc' },
    });

    if (!availablePackage) {
      throw new Error('没有可用的套餐');
    }

    packageUsed = availablePackage;
  }

  if (voucherId && !usePackage) {
    const userVoucher = await prisma.userVoucher.findFirst({
      where: {
        userId: user.id,
        voucherId,
        status: 'active',
        expiry: { gt: new Date() },
      },
    });

    if (!userVoucher) {
      throw new Error('优惠券不可用');
    }
  }

  const order = await prisma.$transaction(async (tx) => {
    // Atomically decrement stock to avoid overselling under concurrency.
    const stockResult = await tx.stringInventory.updateMany({
      where: { id: stringId, stock: { gte: 1 } },
      data: { stock: { decrement: 1 } },
    });

    if (stockResult.count === 0) {
      throw new Error('球线库存不足');
    }

    const newOrder = await tx.order.create({
      data: {
        userId: user.id,
        stringId,
        tension,
        price: finalPrice,
        cost: costPrice || string.costPrice,
        profit: finalPrice - (costPrice || string.costPrice),
        discount: discountAmount,
        discountAmount,
        usePackage,
        packageUsedId: packageUsed?.id || null,
        voucherUsedId: voucherId || null,
        status: usePackage ? 'in_progress' : 'pending',
        notes,
      },
    });

    if (usePackage && packageUsed) {
      const updatedPackage = await tx.userPackage.update({
        where: { id: packageUsed.id },
        data: { remaining: { decrement: 1 } },
      });

      if (updatedPackage.remaining === 0) {
        await tx.userPackage.update({
          where: { id: packageUsed.id },
          data: { status: 'depleted' },
        });
      }
    }

    if (voucherId && !usePackage) {
      await tx.userVoucher.updateMany({
        where: { userId: user.id, voucherId, status: 'active' },
        data: { status: 'used', usedAt: new Date(), orderId: newOrder.id },
      });
    }

    await tx.stockLog.create({
      data: {
        stringId,
        change: -1,
        type: 'sale',
        costPrice: costPrice || string.costPrice,
        referenceId: newOrder.id,
        notes: `订单 ${newOrder.id} 使用`,
        createdBy: user.id,
      },
    });

    if (!usePackage && finalPrice > 0) {
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          userId: user.id,
          amount: finalPrice,
          status: 'pending',
          provider: 'pending',
        },
      });
    }

    return newOrder;
  });

  const fullOrder = await prisma.order.findUnique({
    where: { id: order.id },
    include: {
      string: {
        select: {
          id: true,
          brand: true,
          model: true,
          sellingPrice: true,
        },
      },
      payments: true,
    },
  });

  return fullOrder;
}

/**
 * 创建订单（套餐/优惠券流程，legacy /api/orders/create）
 */
export async function createOrderWithPackageAction(payload: CreateOrderWithPackagePayload) {
  const user = await requireAuth();
  const { stringId, tension, usePackage, packageId, voucherId, notes } = payload;

  if (!stringId || !tension) {
    throw new Error('缺少必填字段');
  }

  if (tension < 18 || tension > 30) {
    throw new Error('张力必须在 18-30 磅之间');
  }

  const string = await prisma.stringInventory.findUnique({
    where: { id: stringId },
  });

  if (!string) {
    throw new Error('球线不存在');
  }

  if (string.stock < 11) {
    throw new Error('库存不足');
  }

  let packageUsed: any = null;
  let basePrice = 35.0;

  if (usePackage && packageId) {
    packageUsed = await prisma.userPackage.findFirst({
      where: {
        id: packageId,
        userId: user.id,
        remaining: { gt: 0 },
        status: 'active',
        expiry: { gte: new Date() },
      },
      include: { package: true },
    });

    if (!packageUsed) {
      throw new Error('套餐不可用');
    }

    basePrice = 0;
  }

  let discount = 0;
  let voucherUsed: any = null;

  if (voucherId) {
    voucherUsed = await prisma.userVoucher.findFirst({
      where: {
        id: voucherId,
        userId: user.id,
        status: 'active',
        expiry: { gte: new Date() },
      },
      include: { voucher: true },
    });

    if (!voucherUsed) {
      throw new Error('优惠券不可用');
    }

    const voucher = voucherUsed.voucher;
    const now = new Date();
    if (now < new Date(voucher.validFrom) || now > new Date(voucher.validUntil)) {
      throw new Error('优惠券不在有效期内');
    }

    const voucherValue = Number(voucher.value);
    const minPurchase = Number(voucher.minPurchase);

    if (Number.isNaN(voucherValue) || voucherValue <= 0) {
      throw new Error('优惠券金额无效');
    }

    if (!Number.isNaN(minPurchase) && basePrice < minPurchase) {
      throw new Error(`最低消费 RM ${minPurchase.toFixed(2)}`);
    }

    if (voucher.type === 'percentage') {
      discount = (basePrice * voucherValue) / 100;
    } else {
      discount = voucherValue;
    }

    discount = Math.min(discount, basePrice);
  }

  const finalPrice = Math.max(0, basePrice - discount);

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        userId: user.id,
        stringId,
        tension,
        price: finalPrice,
        cost: string.costPrice,
        discount,
        discountAmount: discount,
        status: 'pending',
        usePackage: !!usePackage,
        packageUsedId: packageUsed?.id,
        voucherUsedId: voucherUsed?.id,
        notes,
      },
    });

    if (packageUsed) {
      await tx.userPackage.update({
        where: { id: packageUsed.id },
        data: {
          remaining: { decrement: 1 },
          status: packageUsed.remaining - 1 === 0 ? 'depleted' : 'active',
        },
      });
    }

    if (voucherUsed) {
      await tx.userVoucher.update({
        where: { id: voucherUsed.id },
        data: { status: 'used', usedAt: new Date(), orderId: newOrder.id },
      });
    }

    if (finalPrice > 0) {
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          userId: user.id,
          amount: finalPrice,
          provider: 'manual',
          status: 'pending',
        },
      });
    }

    return newOrder;
  });

  return {
    orderId: order.id,
    finalPrice,
    paymentRequired: finalPrice > 0,
  };
}

/**
 * 取消订单（Server Action）
 */
export async function cancelOrderAction(orderId: string) {
  const user = await requireAuth();

  if (!isValidUUID(orderId)) {
    throw new Error('无效的订单编号');
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
    include: { payments: true },
  });

  if (!order) {
    throw new Error('订单不存在');
  }

  if (order.status !== 'pending') {
    throw new Error('只能取消待处理的订单');
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'cancelled' },
    });

    if (order.payments.length > 0) {
      await tx.payment.updateMany({
        where: { orderId, status: 'pending' },
        data: { status: 'cancelled' },
      });
    }

    if (order.packageUsedId) {
      await tx.userPackage.update({
        where: { id: order.packageUsedId },
        data: { remaining: { increment: 1 } },
      });
    }

    await tx.notification.create({
      data: {
        userId: user.id,
        title: '订单已取消',
        message: `订单 #${orderId.slice(0, 8)} 已成功取消`,
        type: 'order',
        actionUrl: `/orders/${orderId}`,
        read: false,
      },
    });
  });
}

/**
 * 完成订单（管理员，Server Action）
 */
export async function completeOrderAction(orderId: string, adminNotes?: string) {
  const admin = await requireAdmin();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      string: true,
      items: true, // Include items for multi-racket orders
    } as any,
  });

  if (!order) {
    throw new Error('订单不存在');
  }

  if (order.status === 'completed') {
    throw new Error('订单已完成');
  }

  if (order.status !== 'in_progress') {
    throw new Error('只能完成进行中的订单');
  }

  // Check if this is a multi-racket order (has items, no direct stringId)
  const isMultiRacketOrder = (order as any).items && (order as any).items.length > 0;

  // For single-racket orders, validate stringId
  if (!isMultiRacketOrder && (!order.stringId || !order.string)) {
    throw new Error('订单没有关联球线');
  }

  const stockToDeduct = 11;

  // Only check/deduct stock for single-racket orders
  // Multi-racket orders already had stock deducted during creation
  if (!isMultiRacketOrder) {
    if ((order.string as any)!.stock < stockToDeduct) {
      throw new Error(`库存不足，当前: ${(order.string as any)!.stock}m，需要: ${stockToDeduct}m`);
    }
  }

  const profit = Number(order.price) - Number((order as any).cost || 0);
  const latestPayment = await prisma.payment.findFirst({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
    select: { amount: true },
  });
  const orderTotalAmount = Number(latestPayment?.amount ?? order.price ?? 0);
  const pointsPerOrder = Math.max(0, Math.floor(orderTotalAmount * 0.5));

  await prisma.$transaction(async (tx) => {
    // Only deduct stock for single-racket orders
    if (!isMultiRacketOrder && order.stringId) {
      // Atomically decrement stock to prevent negative inventory in concurrent completes.
      const stockResult = await tx.stringInventory.updateMany({
        where: { id: order.stringId!, stock: { gte: stockToDeduct } },
        data: { stock: { decrement: stockToDeduct } },
      });

      if (stockResult.count === 0) {
        throw new Error(`库存不足，无法扣减 ${stockToDeduct}m`);
      }

      await tx.stockLog.create({
        data: {
          stringId: order.stringId!,
          change: -stockToDeduct,
          type: 'sale',
          costPrice: (order.string as any)!.costPrice,
          referenceId: orderId,
          notes: `订单完成自动扣减: ${adminNotes || ''}`,
          createdBy: admin.id,
        },
      });
    }

    const newBalance = (order.user as any).points + pointsPerOrder;
    await tx.user.update({
      where: { id: order.userId },
      data: { points: newBalance },
    });

    await tx.pointsLog.create({
      data: {
        userId: order.userId,
        amount: pointsPerOrder,
        type: 'order',
        referenceId: orderId,
        description: `订单完成奖励：订单总额 RM${orderTotalAmount.toFixed(2)} × 50% = ${pointsPerOrder} 积分`,
        balanceAfter: newBalance,
      },
    });

    await tx.order.update({
      where: { id: orderId },
      data: { status: 'completed', profit, completedAt: new Date() },
    });

    await tx.notification.create({
      data: {
        userId: order.userId,
        title: '订单已完成',
        message: `您的订单已完成，订单总额 RM${orderTotalAmount.toFixed(2)}，获得 ${pointsPerOrder} 积分（50%）`,
        type: 'order',
        actionUrl: `/orders/${orderId}`,
      },
    });
  });

  return {
    orderId,
    status: 'completed',
    profit,
    pointsGranted: pointsPerOrder,
    stockDeducted: stockToDeduct,
  };
}

/**
 * 创建多球拍订单（Multi-Racket Order）
 * 
 * 支持在单个订单中包含多支球拍，每支球拍可选择不同的球线和磅数。
 * - 套餐抵扣：N 支球拍 = 扣除 N 次套餐
 * - 球拍照片：必填
 * - 无多球拍折扣
 */
export async function createMultiRacketOrderAction(payload: CreateMultiRacketOrderPayload) {
  const user = await requireAuth();
  const { items, usePackage, packageId, voucherId, notes } = payload;

  // 验证必填字段
  if (!items || items.length === 0) {
    throw new Error('请至少添加一支球拍');
  }

  // 验证每个项目
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.stringId) {
      throw new Error(`第 ${i + 1} 支球拍未选择球线`);
    }
    if (!item.racketPhoto) {
      throw new Error(`第 ${i + 1} 支球拍未上传照片（必填）`);
    }
    if (item.tensionVertical < 18 || item.tensionVertical > 35) {
      throw new Error(`第 ${i + 1} 支球拍竖线磅数需在 18-35 之间`);
    }
    if (item.tensionHorizontal < 18 || item.tensionHorizontal > 35) {
      throw new Error(`第 ${i + 1} 支球拍横线磅数需在 18-35 之间`);
    }
  }

  // 获取所有球线信息
  const stringIds = [...new Set(items.map(item => item.stringId))];
  const strings = await prisma.stringInventory.findMany({
    where: { id: { in: stringIds } },
  });

  const stringMap = new Map(strings.map(s => [s.id, s]));

  // 验证所有球线存在且有库存
  for (const item of items) {
    const string = stringMap.get(item.stringId);
    if (!string) {
      throw new Error(`球线不存在: ${item.stringId}`);
    }
    if (string.stock <= 0) {
      throw new Error(`球线 ${string.brand} ${string.model} 库存不足`);
    }
  }

  // 计算总价
  let totalPrice = 0;
  const itemPrices: number[] = [];
  for (const item of items) {
    const string = stringMap.get(item.stringId)!;
    const price = Number(string.sellingPrice);
    itemPrices.push(price);
    totalPrice += price;
  }

  // 套餐处理
  let packageUsed: any = null;
  const racketCount = items.length;

  if (usePackage && packageId) {
    packageUsed = await prisma.userPackage.findFirst({
      where: {
        id: packageId,
        userId: user.id,
        remaining: { gte: racketCount },  // 需要足够的次数
        status: 'active',
        expiry: { gte: new Date() },
      },
      include: { package: true },
    });

    if (!packageUsed) {
      throw new Error(`套餐次数不足，需要 ${racketCount} 次`);
    }

    // 使用套餐时价格为 0
    totalPrice = 0;
    itemPrices.fill(0);
  }

  // 优惠券处理
  let discount = 0;
  let voucherUsed: any = null;

  if (voucherId && !usePackage) {
    voucherUsed = await prisma.userVoucher.findFirst({
      where: {
        id: voucherId,
        userId: user.id,
        status: 'active',
        expiry: { gte: new Date() },
      },
      include: { voucher: true },
    });

    if (!voucherUsed) {
      throw new Error('优惠券不可用');
    }

    const voucher = voucherUsed.voucher;
    const now = new Date();
    if (now < new Date(voucher.validFrom) || now > new Date(voucher.validUntil)) {
      throw new Error('优惠券不在有效期内');
    }

    const voucherValue = Number(voucher.value);
    const minPurchase = Number(voucher.minPurchase);

    if (totalPrice < minPurchase) {
      throw new Error(`最低消费 RM ${minPurchase.toFixed(2)}`);
    }

    if (voucher.type === 'percentage') {
      discount = (totalPrice * voucherValue) / 100;
    } else {
      discount = voucherValue;
    }

    discount = Math.min(discount, totalPrice);
  }

  const finalPrice = Math.max(0, totalPrice - discount);

  // 创建订单（事务）
  const order = await prisma.$transaction(async (tx) => {
    // 创建主订单
    const newOrder = await tx.order.create({
      data: {
        userId: user.id,
        // Legacy fields left null for multi-racket orders
        stringId: null,
        tension: null,
        price: finalPrice,
        discount,
        discountAmount: discount,
        status: usePackage ? 'in_progress' : 'pending',
        usePackage: !!usePackage,
        packageUsedId: packageUsed?.id || null,
        voucherUsedId: voucherUsed?.id || null,
        notes: notes || `多球拍订单：${racketCount} 支球拍`,
      },
    });

    // 创建订单项
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const string = stringMap.get(item.stringId)!;
      const itemPrice = usePackage ? 0 : itemPrices[i];

      // 创建订单项 (使用动态访问，直到 Prisma 客户端重新生成)
      await (tx as any).orderItem.create({
        data: {
          orderId: newOrder.id,
          stringId: item.stringId,
          tensionVertical: item.tensionVertical,
          tensionHorizontal: item.tensionHorizontal,
          racketBrand: item.racketBrand || null,
          racketModel: item.racketModel || null,
          racketPhoto: item.racketPhoto,
          notes: item.notes || null,
          price: itemPrice,
        },
      });

      // 扣减库存
      const stockResult = await tx.stringInventory.updateMany({
        where: { id: item.stringId, stock: { gte: 1 } },
        data: { stock: { decrement: 1 } },
      });

      if (stockResult.count === 0) {
        throw new Error(`球线 ${string.brand} ${string.model} 库存不足`);
      }

      // 记录库存日志
      await tx.stockLog.create({
        data: {
          stringId: item.stringId,
          change: -1,
          type: 'sale',
          costPrice: string.costPrice,
          referenceId: newOrder.id,
          notes: `多球拍订单 ${newOrder.id} - 第 ${i + 1} 支球拍`,
          createdBy: user.id,
        },
      });
    }

    // 扣除套餐次数（N 支球拍 = N 次）
    if (packageUsed) {
      const updatedPackage = await tx.userPackage.update({
        where: { id: packageUsed.id },
        data: { remaining: { decrement: racketCount } },
      });

      if (updatedPackage.remaining <= 0) {
        await tx.userPackage.update({
          where: { id: packageUsed.id },
          data: { status: 'depleted' },
        });
      }
    }

    // 使用优惠券
    if (voucherUsed) {
      await tx.userVoucher.update({
        where: { id: voucherUsed.id },
        data: { status: 'used', usedAt: new Date(), orderId: newOrder.id },
      });
    }

    // 创建支付记录（非套餐订单）
    if (!usePackage && finalPrice > 0) {
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          userId: user.id,
          amount: finalPrice,
          provider: 'pending',
          status: 'pending',
        },
      });
    }

    return newOrder;
  });

  // 返回完整订单
  const fullOrder = await prisma.order.findUnique({
    where: { id: order.id },
    include: {
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
      payments: true,
    } as any, // Dynamic include until Prisma client is regenerated
  });

  return {
    orderId: order.id,
    racketCount,
    finalPrice,
    paymentRequired: !usePackage && finalPrice > 0,
    order: fullOrder,
  };
}
