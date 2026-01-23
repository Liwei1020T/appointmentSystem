import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-errors';
import { isValidUUID } from '@/lib/utils';
import { User } from '@prisma/client';

type UserSnapshot = Pick<User, 'id'>;
const RENEWAL_WINDOW_DAYS = 7;

/**
 * Fetch all active packages for purchase.
 */
export async function listAvailablePackages(userId?: string) {
  const packages = await prisma.package.findMany({
    where: { active: true },
    orderBy: { price: 'asc' },
  });

  if (!userId) {
    return packages;
  }

  const eligible = await isUserEligibleForFirstOrderPackage(userId);
  if (eligible) {
    return packages;
  }

  return packages.filter((pkg) => !pkg.isFirstOrderOnly);
}

/**
 * Check if a user is eligible for first-order-only packages.
 */
export async function isUserEligibleForFirstOrderPackage(userId: string) {
  const orderCount = await prisma.order.count({
    where: {
      userId,
      status: { in: ['in_progress', 'completed'] },
    },
  });

  return orderCount === 0;
}

/**
 * Return renewal discount when the user's package is nearing expiry.
 */
export async function getRenewalDiscountForUser(userId: string, packageId: string) {
  const pkg = await prisma.package.findUnique({ where: { id: packageId } });
  if (!pkg || pkg.renewalDiscount <= 0) {
    return 0;
  }

  const expiryCutoff = new Date(Date.now() + RENEWAL_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const expiringPackage = await prisma.userPackage.findFirst({
    where: {
      userId,
      packageId,
      expiry: { lte: expiryCutoff },
    },
  });

  return expiringPackage ? pkg.renewalDiscount : 0;
}

/**
 * Apply renewal discount percentage to a price.
 */
export function applyRenewalDiscount(price: number, discountPercent: number) {
  if (!discountPercent || discountPercent <= 0) {
    return price;
  }

  const discounted = price * (1 - discountPercent / 100);
  return Math.round(discounted * 100) / 100;
}

/**
 * Fetch featured packages with a limit.
 */
export async function listFeaturedPackages(limit = 3) {
  return prisma.package.findMany({
    where: { active: true },
    orderBy: [{ price: 'asc' }],
    take: limit,
  });
}

/**
 * Fetch user packages with optional status filtering.
 */
export async function listUserPackages(userId: string, status?: string) {
  const where: Record<string, unknown> = { userId };

  if (status === 'active') {
    where.remaining = { gt: 0 };
    where.expiry = { gt: new Date() };
    where.status = 'active';
  } else if (status) {
    where.status = status;
  }

  return prisma.userPackage.findMany({
    where,
    include: { package: true },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Create a package payment record for the user.
 */
export async function buyPackage(
  user: UserSnapshot,
  payload: { packageId: string; paymentMethod?: string }
) {
  const { packageId, paymentMethod = 'tng' } = payload;

  if (!packageId || !isValidUUID(packageId)) {
    throw new ApiError('BAD_REQUEST', 400, 'Invalid package id');
  }

  const normalizedProvider = paymentMethod === 'cash' ? 'cash' : 'tng';

  const packageData = await prisma.package.findUnique({
    where: { id: packageId },
  });

  if (!packageData) {
    throw new ApiError('NOT_FOUND', 404, 'Package not found');
  }

  if (!packageData.active) {
    throw new ApiError('CONFLICT', 409, 'Package is inactive');
  }

  if (packageData.isFirstOrderOnly) {
    const eligible = await isUserEligibleForFirstOrderPackage(user.id);
    if (!eligible) {
      throw new ApiError('CONFLICT', 409, '首单特价仅限首次下单用户');
    }
  }

  if (Number(packageData.price) <= 0) {
    throw new ApiError('UNPROCESSABLE_ENTITY', 422, 'Invalid package price');
  }

  const baseAmount = Number(packageData.price);
  const renewalDiscount = await getRenewalDiscountForUser(user.id, packageData.id);
  const finalAmount = applyRenewalDiscount(baseAmount, renewalDiscount);

  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      packageId: packageData.id,
      amount: finalAmount,
      provider: normalizedProvider,
      status: 'pending',
      metadata: {
        type: 'package',
        paymentMethod: normalizedProvider,
        renewalDiscount,
        createdAt: new Date().toISOString(),
        note:
          normalizedProvider === 'cash'
            ? 'Cash package purchase pending admin confirmation'
            : 'TNG package purchase pending receipt upload and admin verification',
      },
    },
  });

  return {
    paymentId: payment.id,
    packageId: packageData.id,
    packageName: packageData.name,
    amount: finalAmount,
    originalAmount: baseAmount,
    renewalDiscount,
    times: packageData.times,
    validityDays: packageData.validityDays,
    paymentRequired: true,
    paymentMethod: normalizedProvider,
  };
}

/**
 * Fetch pending package payments for the current user.
 */
export async function listPendingPackagePayments(userId: string) {
  const pendingPayments = await prisma.payment.findMany({
    where: {
      userId,
      packageId: { not: null },
      status: { in: ['pending', 'pending_verification'] },
    },
    include: { package: true },
    orderBy: { createdAt: 'desc' },
  });

  return pendingPayments.map((payment) => ({
    id: payment.id,
    packageId: payment.packageId,
    packageName: payment.package?.name || 'Package',
    packageTimes: payment.package?.times || 0,
    packageValidityDays: payment.package?.validityDays || 0,
    amount: Number(payment.amount),
    status: payment.status,
    provider: payment.provider,
    receiptUrl: (payment.metadata as any)?.receiptUrl,
    createdAt: payment.createdAt.toISOString(),
  }));
}

/**
 * Fetch usage records for a user package.
 */
export async function listPackageUsage(userId: string, userPackageId: string) {
  if (!isValidUUID(userPackageId)) {
    throw new ApiError('BAD_REQUEST', 400, 'Invalid user package id');
  }

  const pkg = await prisma.userPackage.findFirst({
    where: { id: userPackageId, userId },
  });

  if (!pkg) {
    throw new ApiError('NOT_FOUND', 404, 'Package not found');
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
