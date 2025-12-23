'use server';

import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireAuth } from '@/lib/server-auth';

/**
 * 获取支付详情（Server Action）
 */
export async function getPaymentAction(paymentId: string) {
  const user = await requireAuth();

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId },
    include: {
      order: {
        include: {
          user: {
            select: { id: true, email: true, fullName: true },
          },
          string: true,
        },
      },
    },
  });

  if (!payment) {
    throw new Error('支付记录不存在');
  }

  if (user.role !== 'admin' && payment.order && payment.order.userId !== user.id) {
    throw new Error('无权查看此支付记录');
  }

  return payment;
}

/**
 * 创建支付记录（Server Action）
 */
export async function createPaymentAction(payload: {
  amount: number;
  orderId?: string | null;
  packageId?: string | null;
  paymentMethod?: string;
}) {
  const user = await requireAuth();
  const amount = payload.amount;
  const orderId = payload.orderId ?? null;
  const packageId = payload.packageId ?? null;
  const paymentMethod = payload.paymentMethod || 'tng';

  if (!amount || (!orderId && !packageId)) {
    throw new Error('缺少必填字段');
  }

  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      orderId,
      packageId,
      amount: Number(amount),
      provider: paymentMethod,
      status: 'pending',
    },
  });

  return payment;
}

/**
 * 现金支付（Server Action）
 */
export async function createCashPaymentAction(payload: { orderId: string; amount: number }) {
  const user = await requireAuth();
  const { orderId, amount } = payload;

  if (!orderId || !amount) {
    throw new Error('缺少必要参数');
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error('订单不存在');
  }

  if (order.userId !== user.id) {
    throw new Error('无权操作此订单');
  }

  const payment = await prisma.payment.create({
    data: {
      orderId,
      userId: user.id,
      amount: Number(amount),
      status: 'pending',
      provider: 'cash',
      metadata: {
        payment_type: 'cash',
        payment_method: 'cash',
        created_at: new Date().toISOString(),
        note: '客户选择现金支付，等待管理员确认收款',
      },
    },
  });

  return payment;
}

/**
 * 上传支付收据（URL 方式）
 */
export async function uploadPaymentReceiptAction(payload: { paymentId: string; receiptUrl: string }) {
  const user = await requireAuth();
  const { paymentId, receiptUrl } = payload;

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, userId: user.id },
  });

  if (!payment) {
    throw new Error('支付记录不存在');
  }

  if (!receiptUrl) {
    throw new Error('缺少收据URL');
  }

  const updatedPayment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      metadata: {
        ...(payment.metadata as any),
        proofUrl: (payment.metadata as any)?.proofUrl || receiptUrl,
        receiptUrl,
        uploadedAt: new Date().toISOString(),
      },
      status: 'pending_verification',
    },
  });

  return updatedPayment;
}

/**
 * 管理员 - 获取待审核支付
 */
export async function getPendingPaymentsAction(options?: { page?: number; limit?: number }) {
  await requireAdmin();
  const page = options?.page ? Number(options.page) : 1;
  const limit = options?.limit ? Number(options.limit) : 20;
  const skip = (page - 1) * limit;

  const where: Prisma.PaymentWhereInput = {
    OR: [
      { provider: { not: 'cash' }, status: 'pending_verification' },
      { provider: 'cash', status: { in: ['pending', 'pending_verification'] } },
    ],
  };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, fullName: true, phone: true } },
        order: { include: { string: { select: { brand: true, model: true } } } },
        package: {
          select: { id: true, name: true, times: true, validityDays: true, price: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    payments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * 管理员 - 确认支付
 */
export async function confirmPaymentAction(paymentId: string, transactionId?: string, notes?: string) {
  const admin = await requireAdmin();

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      order: {
        include: {
          user: { select: { id: true, email: true, fullName: true } },
        },
      },
    },
  });

  if (!payment) {
    throw new Error('支付记录不存在');
  }

  if (payment.status === 'success') {
    throw new Error('该支付已确认，无需重复操作');
  }

  const targetUserId = payment.order?.userId || payment.userId;

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: 'success',
        transactionId: transactionId || null,
        metadata: {
          ...(payment.metadata as any),
          verifiedAt: new Date().toISOString(),
          verifiedBy: admin.id,
          adminNotes: notes || null,
        },
      },
    });

    // Removed: automatic order status change to in_progress
    // Admin will manually start stringing from order detail page

    const paymentMeta = (payment.metadata as any) || {};
    const packageId = payment.packageId;
    const isPackagePurchase = !!packageId && (!payment.orderId || paymentMeta?.type === 'package');

    if (isPackagePurchase) {
      const existingUserPackage = await tx.userPackage.findFirst({
        where: {
          userId: targetUserId,
          packageId,
          createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
        },
      });

      if (!existingUserPackage) {
        const pkg = await tx.package.findUnique({ where: { id: packageId } });
        if (pkg) {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + pkg.validityDays);
          await tx.userPackage.create({
            data: {
              userId: targetUserId,
              packageId: pkg.id,
              remaining: pkg.times,
              originalTimes: pkg.times,
              status: 'active',
              expiry: expiryDate,
            },
          });
        }
      }
    }

    if (payment.order) {
      await tx.notification.create({
        data: {
          userId: payment.order.userId,
          title: '支付已确认',
          message: `您的支付已确认，订单 #${payment.orderId?.slice(0, 8)} 已生效`,
          type: 'payment',
          actionUrl: `/orders/${payment.orderId}`,
          read: false,
        },
      });
    } else if (packageId) {
      await tx.notification.create({
        data: {
          userId: targetUserId,
          title: '支付已确认',
          message: '您的套餐支付已确认，可在“我的套餐”查看',
          type: 'payment',
          actionUrl: '/profile/packages',
          read: false,
        },
      });
    }
  });
}

/**
 * 管理员 - 拒绝支付
 */
export async function rejectPaymentAction(paymentId: string, reason: string) {
  await requireAdmin();

  if (!reason) {
    throw new Error('请提供拒绝原因');
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: { select: { id: true, userId: true } } },
  });

  if (!payment) {
    throw new Error('支付记录不存在');
  }

  if (payment.status === 'success' || payment.status === 'completed') {
    throw new Error('该支付已确认，无法拒绝');
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: 'rejected',
        metadata: {
          ...(payment.metadata as any),
          rejectedAt: new Date().toISOString(),
          rejectReason: reason,
        },
      },
    });

    if (payment.orderId) {
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: 'payment_rejected' },
      });
    }

    await tx.notification.create({
      data: {
        userId: payment.order?.userId || payment.userId,
        title: '支付被拒绝',
        message: `您的支付未通过审核。原因：${reason}。请重新提交正确的支付凭证。`,
        type: 'payment',
        actionUrl: payment.orderId ? `/orders/${payment.orderId}` : '/profile/packages',
        read: false,
      },
    });
  });
}

/**
 * 管理员 - 确认现金支付
 */
export async function confirmCashPaymentAction(paymentId: string) {
  const admin = await requireAdmin();

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: true, package: true },
  });

  if (!payment) {
    throw new Error('支付记录不存在');
  }

  if (payment.provider !== 'cash') {
    throw new Error('只能确认现金支付');
  }

  if (payment.status === 'success' || payment.status === 'completed') {
    throw new Error('该支付已确认');
  }

  const updatedPayment = await prisma.$transaction(async (tx) => {
    const updated = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: 'success',
        metadata: {
          ...(payment.metadata as any),
          confirmed_by: admin.id,
          confirmed_at: new Date().toISOString(),
          confirmed_by_name: admin.fullName,
        },
      },
    });

    // Removed: automatic order status change to in_progress
    // Admin will manually start stringing from order detail page

    if (payment.packageId) {
      const existingUserPackage = await tx.userPackage.findFirst({
        where: {
          userId: payment.userId,
          packageId: payment.packageId,
          createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
        },
      });

      if (!existingUserPackage) {
        const pkg = await tx.package.findUnique({ where: { id: payment.packageId } });
        if (pkg) {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + pkg.validityDays);
          await tx.userPackage.create({
            data: {
              userId: payment.userId,
              packageId: pkg.id,
              remaining: pkg.times,
              originalTimes: pkg.times,
              status: 'active',
              expiry: expiryDate,
            },
          });
        }
      }
    }

    await tx.notification.create({
      data: {
        userId: payment.userId,
        title: '支付已确认',
        message: payment.packageId
          ? '您的套餐现金支付已确认，可在“我的套餐”查看'
          : `您的现金支付已确认，订单 #${payment.orderId?.slice(0, 8)} 已生效`,
        type: 'payment',
        actionUrl: payment.packageId ? '/profile/packages' : `/orders/${payment.orderId}`,
        read: false,
      },
    });

    return updated;
  });

  return updatedPayment;
}
