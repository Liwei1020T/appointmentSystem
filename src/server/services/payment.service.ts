import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-errors';
import { ADMIN_ROLES, isAdminRole } from '@/lib/roles';
import { User } from '@prisma/client';

const CONFIRMED_STATUSES = new Set(['success', 'completed']);

type AdminSnapshot = Pick<User, 'id' | 'fullName'>;

type UserSnapshot = Pick<User, 'id' | 'role'>;

/**
 * Determines whether an order should advance based on payment status.
 * @param orderStatus Current order status
 * @param paymentStatus Current payment status
 * @returns True when the order should move forward
 */
export function shouldAdvanceOrderStatus(orderStatus: string, paymentStatus: string) {
  return orderStatus === 'pending' && paymentStatus === 'success';
}

export async function getPaymentForUser(params: { paymentId: string; user: UserSnapshot }) {
  const { paymentId, user } = params;
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId },
    include: {
      order: {
        include: {
          user: { select: { id: true, email: true, fullName: true } },
          string: true,
        },
      },
      package: { select: { id: true, name: true, times: true, validityDays: true, price: true } },
    },
  });

  if (!payment) {
    throw new ApiError('NOT_FOUND', 404, 'Payment not found');
  }

  if (!isAdminRole(user.role)) {
    const ownsOrder = payment.order?.userId === user.id;
    const ownsPayment = !payment.order && payment.userId === user.id;
    if (!ownsOrder && !ownsPayment) {
      throw new ApiError('FORBIDDEN', 403, 'Forbidden');
    }
  }

  return payment;
}

export async function createPayment(params: {
  userId: string;
  amount: number;
  orderId?: string | null;
  packageId?: string | null;
  paymentMethod?: string | null;
}) {
  const { userId, amount, orderId, packageId, paymentMethod } = params;

  if (!amount || (!orderId && !packageId)) {
    throw new ApiError('BAD_REQUEST', 400, 'Missing required fields');
  }

  if (orderId) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== userId) {
      throw new ApiError('FORBIDDEN', 403, 'Forbidden');
    }
  }

  const payment = await prisma.payment.create({
    data: {
      userId,
      orderId: orderId ?? null,
      packageId: packageId ?? null,
      amount: Number(amount),
      provider: paymentMethod || 'tng',
      status: 'pending',
    },
  });

  return payment;
}

export async function createCashPayment(params: { userId: string; orderId: string; amount: number }) {
  const { userId, orderId, amount } = params;
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order) {
    throw new ApiError('NOT_FOUND', 404, 'Order not found');
  }

  if (order.userId !== userId) {
    throw new ApiError('FORBIDDEN', 403, 'Forbidden');
  }

  return prisma.payment.create({
    data: {
      orderId,
      userId,
      amount: Number(amount),
      status: 'pending',
      provider: 'cash',
      metadata: {
        payment_type: 'cash',
        payment_method: 'cash',
        created_at: new Date().toISOString(),
        note: 'Customer selected cash payment; awaiting admin confirmation.',
      },
    },
  });
}

export async function listPendingPayments(params?: { page?: number; limit?: number }) {
  const page = params?.page ? Number(params.page) : 1;
  const limit = params?.limit ? Number(params.limit) : 20;
  const skip = (page - 1) * limit;

  const where = {
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

export async function rejectPayment(params: { paymentId: string; reason: string }) {
  const { paymentId, reason } = params;

  if (!reason?.trim()) {
    throw new ApiError('BAD_REQUEST', 400, 'Reject reason is required');
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: { select: { id: true, userId: true } } },
  });

  if (!payment) {
    throw new ApiError('NOT_FOUND', 404, 'Payment not found');
  }

  if (CONFIRMED_STATUSES.has(payment.status)) {
    throw new ApiError('CONFLICT', 409, 'Payment already confirmed');
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
        title: 'Payment rejected',
        message: `Your payment was rejected. Reason: ${reason}. Please resubmit a valid receipt.`,
        type: 'payment',
        actionUrl: payment.orderId ? `/orders/${payment.orderId}` : '/profile/packages',
        read: false,
      },
    });
  });
}

export async function recordPaymentProof(params: {
  paymentId: string;
  userId: string;
  proofUrl: string;
}) {
  const { paymentId, userId, proofUrl } = params;

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId },
    include: {
      user: { select: { id: true } },
      order: { select: { userId: true, id: true } },
      package: { select: { id: true, name: true } },
    },
  });

  if (!payment) {
    throw new ApiError('NOT_FOUND', 404, 'Payment not found');
  }

  if (payment.order && payment.order.userId !== userId) {
    throw new ApiError('FORBIDDEN', 403, 'Forbidden');
  }

  if (!payment.order && payment.userId !== userId) {
    throw new ApiError('FORBIDDEN', 403, 'Forbidden');
  }

  if (!['pending', 'pending_verification', 'rejected', 'failed'].includes(payment.status)) {
    throw new ApiError('CONFLICT', 409, 'Payment already processed');
  }

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      metadata: {
        ...(payment.metadata as any),
        proofUrl,
        receiptUrl: (payment.metadata as any)?.receiptUrl || proofUrl,
        uploadedAt: new Date().toISOString(),
      },
      status: 'pending_verification',
    },
  });

  const admins = await prisma.user.findMany({
    where: { role: { in: Array.from(ADMIN_ROLES) } },
    select: { id: true },
  });

  await Promise.all(
    admins.map((admin) =>
      prisma.notification.create({
        data: {
          userId: admin.id,
          title: 'Payment proof uploaded',
          message: payment.order
            ? `Order #${payment.order.id.slice(0, 8)} uploaded a payment proof`
            : `Package ${payment.package?.name || payment.packageId || ''} uploaded a payment proof`,
          type: 'payment',
          actionUrl: '/admin/payments',
          read: false,
        },
      })
    )
  );

  await prisma.notification.create({
    data: {
      userId,
      title: 'Payment proof submitted',
      message: 'Your payment proof has been submitted and is awaiting review.',
      type: 'payment',
      actionUrl: payment.orderId ? `/orders/${payment.orderId}` : '/profile/packages',
      read: false,
    },
  });

  return { proofUrl };
}

export async function verifyPayment(params: {
  paymentId: string;
  admin: AdminSnapshot;
  transactionId?: string | null;
  notes?: string | null;
  requireCash?: boolean;
}) {
  const { paymentId, admin, transactionId, notes, requireCash = false } = params;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      order: { select: { id: true, userId: true, status: true } },
      package: { select: { id: true, name: true, times: true, validityDays: true, price: true } },
    },
  });

  if (!payment) {
    throw new ApiError('NOT_FOUND', 404, 'Payment not found');
  }

  if (requireCash && payment.provider !== 'cash') {
    throw new ApiError('BAD_REQUEST', 400, 'Only cash payments can be confirmed here');
  }

  if (CONFIRMED_STATUSES.has(payment.status)) {
    throw new ApiError('CONFLICT', 409, 'Payment already confirmed');
  }

  const isCash = payment.provider === 'cash';
  const targetUserId = payment.order?.userId || payment.userId;
  const paymentMeta = (payment.metadata as Record<string, unknown>) || {};
  const normalizedTransactionId = transactionId?.trim() || null;
  const normalizedNotes = notes?.trim() || null;

  return prisma.$transaction(async (tx) => {
    const metadata: any = { ...paymentMeta };

    if (isCash) {
      metadata.confirmed_by = admin.id;
      metadata.confirmed_at = new Date().toISOString();
      metadata.confirmed_by_name = admin.fullName || null;
    } else {
      metadata.verifiedAt = new Date().toISOString();
      metadata.verifiedBy = admin.id;
    }

    if (normalizedNotes) {
      metadata.adminNotes = normalizedNotes;
    }

    const updated = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: 'success',
        transactionId: normalizedTransactionId,
        metadata,
      },
    });

    const isPackagePurchase =
      !!payment.packageId && (!payment.orderId || (paymentMeta as any)?.type === 'package');

    if (isPackagePurchase && payment.packageId) {
      const existingUserPackage = await tx.userPackage.findFirst({
        where: {
          userId: targetUserId,
          packageId: payment.packageId,
          createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
        },
      });

      if (!existingUserPackage) {
        const pkg =
          payment.package || (await tx.package.findUnique({ where: { id: payment.packageId } }));
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

    if (payment.orderId) {
      if (payment.order && shouldAdvanceOrderStatus(payment.order.status, 'success')) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: 'in_progress' },
        });
      }

      await tx.notification.create({
        data: {
          userId: targetUserId,
          title: 'Payment confirmed',
          message: `Your payment has been confirmed. Order #${payment.orderId.slice(0, 8)} is now active.`,
          type: 'payment',
          actionUrl: `/orders/${payment.orderId}`,
          read: false,
        },
      });
    } else if (payment.packageId) {
      await tx.notification.create({
        data: {
          userId: targetUserId,
          title: 'Payment confirmed',
          message: 'Your package payment has been confirmed. Check “My Packages” for details.',
          type: 'payment',
          actionUrl: '/profile/packages',
          read: false,
        },
      });
    }

    return updated;
  });
}
