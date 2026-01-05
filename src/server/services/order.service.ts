import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-errors';
import { isValidUUID } from '@/lib/utils';
import { Prisma, User } from '@prisma/client';
import { INVENTORY, ORDER_RULES, POINTS, PRICING } from '@/lib/constants';

export interface CreateOrderPayload {
  stringId?: string;
  tension?: number | string;
  price?: number | string;
  costPrice?: number | string;
  discountAmount?: number | string;
  finalPrice?: number | string;
  usePackage?: boolean;
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

export interface OrderItemPayload {
  stringId: string;
  tensionVertical: number;
  tensionHorizontal: number;
  racketBrand?: string;
  racketModel?: string;
  racketPhoto: string;
  notes?: string;
}

export interface CreateMultiRacketOrderPayload {
  items: OrderItemPayload[];
  usePackage?: boolean;
  packageId?: string;
  voucherId?: string;
  notes?: string;
  serviceType?: 'in_store' | 'pickup_delivery';
  pickupAddress?: string;
}

type UserSnapshot = Pick<User, 'id' | 'role' | 'fullName'>;

type AdminSnapshot = UserSnapshot;

// Define type-safe includes
const orderListInclude = {
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
  items: {
    select: { id: true },
  },
} satisfies Prisma.OrderInclude;

export type OrderListResult = Prisma.OrderGetPayload<{
  include: typeof orderListInclude;
}>;

const orderDetailInclude = {
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
} satisfies Prisma.OrderInclude;

export type OrderDetailResult = Prisma.OrderGetPayload<{
  include: typeof orderDetailInclude;
}>;

const orderCompletionInclude = {
  user: true,
  string: true,
  items: true,
} satisfies Prisma.OrderInclude;

export async function getUserOrders(
  userId: string,
  options?: { status?: string; limit?: number; page?: number }
) {
  const status = options?.status;
  const limit = options?.limit ? Number(options.limit) : undefined;
  const page = options?.page ? Number(options.page) : undefined;
  const take = limit ? Number(limit) : undefined;
  const skip = page && take ? (Number(page) - 1) * take : undefined;

  return prisma.order.findMany({
    where: {
      userId,
      ...(status ? { status } : {}),
    },
    include: orderListInclude,
    orderBy: { createdAt: 'desc' },
    ...(take ? { take } : {}),
    ...(skip !== undefined ? { skip } : {}),
  });
}

export async function getOrderById(userId: string, orderId: string) {
  if (!isValidUUID(orderId)) {
    throw new ApiError('BAD_REQUEST', 400, 'Invalid order id');
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: orderDetailInclude,
  });

  if (!order) {
    throw new ApiError('NOT_FOUND', 404, 'Order not found');
  }

  return order;
}

export async function createOrder(user: UserSnapshot, payload: CreateOrderPayload) {
  const stringId = payload.stringId;
  const tension = Number(payload.tension);
  const finalPrice = payload.finalPrice !== undefined ? Number(payload.finalPrice) : undefined;
  const costPrice = payload.costPrice !== undefined ? Number(payload.costPrice) : undefined;
  const discountAmount = payload.discountAmount !== undefined ? Number(payload.discountAmount) : 0;
  const usePackage = payload.usePackage ?? false;
  const voucherId = payload.voucherId ?? null;
  const notes = payload.notes ?? '';

  if (!stringId || !Number.isFinite(tension) || finalPrice === undefined) {
    throw new ApiError('BAD_REQUEST', 400, 'Missing required fields');
  }

  const string = await prisma.stringInventory.findUnique({
    where: { id: stringId },
  });

  if (!string) {
    throw new ApiError('NOT_FOUND', 404, 'String not found');
  }

  if (string.stock <= 0) {
    throw new ApiError('CONFLICT', 409, 'Insufficient stock');
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
      throw new ApiError('CONFLICT', 409, 'No available package');
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
      throw new ApiError('CONFLICT', 409, 'Voucher not available');
    }
  }

  const order = await prisma.$transaction(async (tx) => {
    const stockResult = await tx.stringInventory.updateMany({
      where: { id: stringId, stock: { gte: INVENTORY.DEDUCT_ON_CREATE } },
      data: { stock: { decrement: INVENTORY.DEDUCT_ON_CREATE } },
    });

    if (stockResult.count === 0) {
      throw new ApiError('CONFLICT', 409, 'Insufficient stock');
    }

    const newOrder = await tx.order.create({
      data: {
        userId: user.id,
        stringId,
        tension,
        price: finalPrice,
        cost: costPrice || string.costPrice,
        profit: finalPrice - (costPrice || Number(string.costPrice)),
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
        change: -INVENTORY.DEDUCT_ON_CREATE,
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

export async function createOrderWithPackage(user: UserSnapshot, payload: CreateOrderWithPackagePayload) {
  const { stringId, tension, usePackage, packageId, voucherId, notes } = payload;

  if (!stringId || !tension) {
    throw new ApiError('BAD_REQUEST', 400, 'Missing required fields');
  }

  if (tension < ORDER_RULES.MIN_TENSION || tension > ORDER_RULES.MAX_TENSION) {
    throw new ApiError('UNPROCESSABLE_ENTITY', 422, `Tension must be between ${ORDER_RULES.MIN_TENSION} and ${ORDER_RULES.MAX_TENSION}`);
  }

  const string = await prisma.stringInventory.findUnique({
    where: { id: stringId },
  });

  if (!string) {
    throw new ApiError('NOT_FOUND', 404, 'String not found');
  }

  if (string.stock < INVENTORY.DEDUCT_ON_COMPLETE) {
    throw new ApiError('CONFLICT', 409, 'Insufficient stock');
  }

  let packageUsed: any = null;
  let basePrice: number = PRICING.DEFAULT_BASE_PRICE;

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
      throw new ApiError('CONFLICT', 409, 'Package not available');
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
      throw new ApiError('CONFLICT', 409, 'Voucher not available');
    }

    const voucher = voucherUsed.voucher;
    const now = new Date();
    if (now < new Date(voucher.validFrom) || now > new Date(voucher.validUntil)) {
      throw new ApiError('CONFLICT', 409, 'Voucher not valid');
    }

    const voucherValue = Number(voucher.value);
    const minPurchase = Number(voucher.minPurchase);

    if (!Number.isFinite(voucherValue) || voucherValue <= 0) {
      throw new ApiError('UNPROCESSABLE_ENTITY', 422, 'Invalid voucher value');
    }

    if (!Number.isNaN(minPurchase) && basePrice < minPurchase) {
      throw new ApiError('UNPROCESSABLE_ENTITY', 422, `Minimum purchase RM ${minPurchase.toFixed(2)}`);
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

export async function createMultiRacketOrder(user: UserSnapshot, payload: CreateMultiRacketOrderPayload) {
  const { items, usePackage, packageId, voucherId, notes, serviceType, pickupAddress } = payload;

  if (!items || items.length === 0) {
    throw new ApiError('BAD_REQUEST', 400, 'At least one racket is required');
  }

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (!item.stringId) {
      throw new ApiError('BAD_REQUEST', 400, `Racket ${i + 1} missing string`);
    }
    if (!item.racketPhoto) {
      throw new ApiError('BAD_REQUEST', 400, `Racket ${i + 1} missing photo`);
    }
    if (item.tensionVertical < ORDER_RULES.MIN_TENSION || item.tensionVertical > ORDER_RULES.MAX_TENSION) {
      throw new ApiError('UNPROCESSABLE_ENTITY', 422, `Racket ${i + 1} vertical tension must be ${ORDER_RULES.MIN_TENSION}-${ORDER_RULES.MAX_TENSION}`);
    }
    if (item.tensionHorizontal < ORDER_RULES.MIN_TENSION || item.tensionHorizontal > ORDER_RULES.MAX_TENSION) {
      throw new ApiError('UNPROCESSABLE_ENTITY', 422, `Racket ${i + 1} horizontal tension must be ${ORDER_RULES.MIN_TENSION}-${ORDER_RULES.MAX_TENSION}`);
    }
    // Enforce cross/main tension difference within the allowed range.
    const diff = item.tensionHorizontal - item.tensionVertical;
    if (diff < ORDER_RULES.MIN_TENSION_DIFF || diff > ORDER_RULES.MAX_TENSION_DIFF) {
      throw new ApiError(
        'UNPROCESSABLE_ENTITY',
        422,
        `Racket ${i + 1} tension difference must be ${ORDER_RULES.MIN_TENSION_DIFF}-${ORDER_RULES.MAX_TENSION_DIFF} lbs`
      );
    }
  }

  const stringIds = [...new Set(items.map((item) => item.stringId))];
  const strings = await prisma.stringInventory.findMany({
    where: { id: { in: stringIds } },
  });
  const stringMap = new Map(strings.map((s) => [s.id, s]));

  for (const item of items) {
    const string = stringMap.get(item.stringId);
    if (!string) {
      throw new ApiError('NOT_FOUND', 404, `String not found: ${item.stringId}`);
    }
    if (string.stock <= 0) {
      throw new ApiError('CONFLICT', 409, `Insufficient stock for ${string.brand} ${string.model}`);
    }
  }

  let totalPrice = 0;
  const itemPrices: number[] = [];
  for (const item of items) {
    const string = stringMap.get(item.stringId)!;
    const price = Number(string.sellingPrice);
    itemPrices.push(price);
    totalPrice += price;
  }

  let packageUsed: any = null;
  const racketCount = items.length;

  if (usePackage && packageId) {
    packageUsed = await prisma.userPackage.findFirst({
      where: {
        id: packageId,
        userId: user.id,
        remaining: { gte: racketCount },
        status: 'active',
        expiry: { gte: new Date() },
      },
      include: { package: true },
    });

    if (!packageUsed) {
      throw new ApiError('CONFLICT', 409, `Package usage requires ${racketCount} remaining`);
    }

    totalPrice = 0;
    itemPrices.fill(0);
  }

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
      throw new ApiError('CONFLICT', 409, 'Voucher not available');
    }

    const voucher = voucherUsed.voucher;
    const now = new Date();
    if (now < new Date(voucher.validFrom) || now > new Date(voucher.validUntil)) {
      throw new ApiError('CONFLICT', 409, 'Voucher not valid');
    }

    const voucherValue = Number(voucher.value);
    const minPurchase = Number(voucher.minPurchase);

    if (totalPrice < minPurchase) {
      throw new ApiError('UNPROCESSABLE_ENTITY', 422, `Minimum purchase RM ${minPurchase.toFixed(2)}`);
    }

    if (voucher.type === 'percentage') {
      discount = (totalPrice * voucherValue) / 100;
    } else {
      discount = voucherValue;
    }

    discount = Math.min(discount, totalPrice);
  }

  const finalPrice = Math.max(0, totalPrice - discount);

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        userId: user.id,
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
        serviceType: serviceType || 'in_store',
        pickupAddress: serviceType === 'pickup_delivery' ? pickupAddress : null,
      },
    });

    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      const string = stringMap.get(item.stringId)!;
      const itemPrice = usePackage ? 0 : itemPrices[i];

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

      const stockResult = await tx.stringInventory.updateMany({
        where: { id: item.stringId, stock: { gte: INVENTORY.DEDUCT_ON_CREATE } },
        data: { stock: { decrement: INVENTORY.DEDUCT_ON_CREATE } },
      });

      if (stockResult.count === 0) {
        throw new ApiError('CONFLICT', 409, `Insufficient stock for ${string.brand} ${string.model}`);
      }

      await tx.stockLog.create({
        data: {
          stringId: item.stringId,
          change: -INVENTORY.DEDUCT_ON_CREATE,
          type: 'sale',
          costPrice: string.costPrice,
          referenceId: newOrder.id,
          notes: `多球拍订单 ${newOrder.id} - 第 ${i + 1} 支球拍`,
          createdBy: user.id,
        },
      });
    }

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

    if (voucherUsed) {
      await tx.userVoucher.update({
        where: { id: voucherUsed.id },
        data: { status: 'used', usedAt: new Date(), orderId: newOrder.id },
      });
    }

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
    },
  });

  return {
    orderId: order.id,
    racketCount,
    finalPrice,
    paymentRequired: !usePackage && finalPrice > 0,
    order: fullOrder,
  };
}

export async function cancelOrder(user: UserSnapshot, orderId: string) {
  if (!isValidUUID(orderId)) {
    throw new ApiError('BAD_REQUEST', 400, 'Invalid order id');
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
    include: { payments: true },
  });

  if (!order) {
    throw new ApiError('NOT_FOUND', 404, 'Order not found');
  }

  if (order.status !== 'pending') {
    throw new ApiError('UNPROCESSABLE_ENTITY', 422, 'Only pending orders can be cancelled');
  }

  await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id: orderId, userId: user.id, status: 'pending' },
      data: { status: 'cancelled' },
    });

    if (updated.count === 0) {
      throw new ApiError('UNPROCESSABLE_ENTITY', 422, 'Only pending orders can be cancelled');
    }

    if (order.payments.length > 0) {
      await tx.payment.updateMany({
        where: { orderId, status: 'pending' },
        data: { status: 'cancelled' },
      });
    }

    if (order.packageUsedId) {
      const currentPackage = await tx.userPackage.findUnique({
        where: { id: order.packageUsedId },
        select: { remaining: true, expiry: true },
      });

      if (currentPackage) {
        const now = new Date();
        const newRemaining = currentPackage.remaining + 1;
        const status = currentPackage.expiry < now ? 'expired' : newRemaining > 0 ? 'active' : 'depleted';

        await tx.userPackage.update({
          where: { id: order.packageUsedId },
          data: { remaining: { increment: 1 }, status },
        });
      }
    }

    // Restore any vouchers that were marked as used during order creation.
    await tx.userVoucher.updateMany({
      where: { orderId, status: 'used' },
      data: { status: 'active', usedAt: null, orderId: null },
    });

    // Release reserved inventory based on stock logs tied to this order.
    const reservedLogs = await tx.stockLog.findMany({
      where: { referenceId: orderId, change: { lt: 0 }, type: 'sale' },
      select: { stringId: true, change: true },
    });

    const restoreByStringId = new Map<string, number>();
    for (const log of reservedLogs) {
      const amount = -Number(log.change);
      if (!Number.isFinite(amount) || amount <= 0) continue;
      restoreByStringId.set(log.stringId, (restoreByStringId.get(log.stringId) ?? 0) + amount);
    }

    for (const [stringId, amount] of restoreByStringId.entries()) {
      await tx.stringInventory.update({
        where: { id: stringId },
        data: { stock: { increment: amount } },
      });
    }

    const restoreLogs = Array.from(restoreByStringId.entries()).map(([stringId, amount]) => ({
      stringId,
      change: amount,
      type: 'return',
      referenceId: orderId,
      notes: '订单取消返还',
      createdBy: user.id,
    }));

    if (restoreLogs.length > 0) {
      await tx.stockLog.createMany({ data: restoreLogs });
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

export async function completeOrder(admin: AdminSnapshot, orderId: string, adminNotes?: string) {
  if (!isValidUUID(orderId)) {
    throw new ApiError('BAD_REQUEST', 400, 'Invalid order id');
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderCompletionInclude,
  });

  if (!order) {
    throw new ApiError('NOT_FOUND', 404, 'Order not found');
  }

  if (order.status === 'completed') {
    throw new ApiError('CONFLICT', 409, 'Order already completed');
  }

  if (order.status !== 'in_progress') {
    throw new ApiError('UNPROCESSABLE_ENTITY', 422, 'Only in-progress orders can be completed');
  }

  const isMultiRacketOrder = (order.items && order.items.length > 0);

  if (!isMultiRacketOrder && (!order.stringId || !order.string)) {
    throw new ApiError('CONFLICT', 409, 'Order missing string');
  }

  const stockToDeduct = INVENTORY.DEDUCT_ON_COMPLETE;

  if (!isMultiRacketOrder) {
    if (order.string && order.string.stock < stockToDeduct) {
      throw new ApiError('CONFLICT', 409, `Insufficient stock for completion`);
    }
  }

  const profit = Number(order.price) - Number(order.cost || 0);
  const latestPayment = await prisma.payment.findFirst({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
    select: { amount: true },
  });
  const orderTotalAmount = Number(latestPayment?.amount ?? order.price ?? 0);
  const pointsPerOrder = Math.max(0, Math.floor(orderTotalAmount * POINTS.REWARD_RATE));

  await prisma.$transaction(async (tx) => {
    if (!isMultiRacketOrder && order.stringId && order.string) {
      const stockResult = await tx.stringInventory.updateMany({
        where: { id: order.stringId, stock: { gte: stockToDeduct } },
        data: { stock: { decrement: stockToDeduct } },
      });

      if (stockResult.count === 0) {
        throw new ApiError('CONFLICT', 409, `Insufficient stock`);
      }

      await tx.stockLog.create({
        data: {
          stringId: order.stringId,
          change: -stockToDeduct,
          type: 'sale',
          costPrice: order.string.costPrice,
          referenceId: orderId,
          notes: `订单完成自动扣减: ${adminNotes || ''}`,
          createdBy: admin.id,
        },
      });
    }

    const newBalance = order.user.points + pointsPerOrder;
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
        description: `订单完成奖励：订单总额 RM${orderTotalAmount.toFixed(2)} × ${POINTS.REWARD_RATE * 100}% = ${pointsPerOrder} 积分`,
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
        message: `您的订单已完成，订单总额 RM${orderTotalAmount.toFixed(2)}，获得 ${pointsPerOrder} 积分（${POINTS.REWARD_RATE * 100}%）`,
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
