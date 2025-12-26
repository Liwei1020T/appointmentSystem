import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-errors';
import { isValidUUID } from '@/lib/utils';

type PackageFilters = {
  status?: 'active' | 'inactive' | 'all';
  search?: string;
  includeInactive?: boolean;
};

type PackageCreateInput = {
  name: string;
  description?: string;
  times: number;
  price: number;
  validityDays: number;
  active?: boolean;
  imageUrl?: string | null;
};

type PackageUpdateInput = Partial<PackageCreateInput>;

type PurchaseFilters = {
  userId?: string;
  packageId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
};

function normalizePackage(pkg: any) {
  return {
    ...pkg,
    validity_days: pkg.validityDays,
    created_at: pkg.createdAt,
    updated_at: pkg.updatedAt,
    image_url: pkg.imageUrl,
    original_price: pkg.originalPrice,
  };
}

function normalizeUserPackage(record: any) {
  return {
    ...record,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
    expiry: record.expiry,
    user: record.user
      ? {
          id: record.user.id,
          fullName: record.user.fullName,
          full_name: record.user.fullName,
          email: record.user.email,
          phone: record.user.phone,
        }
      : undefined,
    package: record.package
      ? {
          id: record.package.id,
          name: record.package.name,
          times: record.package.times,
          price: record.package.price,
        }
      : undefined,
  };
}

export async function listAdminPackages(filters: PackageFilters) {
  const where: Record<string, unknown> = {};
  const status = filters.status ?? 'all';
  const includeInactive = filters.includeInactive ?? true;

  if (status === 'active') where.active = true;
  if (status === 'inactive') where.active = false;
  if (!includeInactive) where.active = true;

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const packages = await prisma.package.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return packages.map(normalizePackage);
}

export async function getAdminPackageById(packageId: string) {
  if (!isValidUUID(packageId)) {
    throw new ApiError('BAD_REQUEST', 400, 'Invalid package id');
  }

  const pkg = await prisma.package.findUnique({ where: { id: packageId } });
  if (!pkg) {
    throw new ApiError('NOT_FOUND', 404, 'Package not found');
  }

  return normalizePackage(pkg);
}

export async function createAdminPackage(payload: PackageCreateInput) {
  const pkg = await prisma.package.create({
    data: {
      name: payload.name,
      description: payload.description || '',
      times: payload.times,
      price: payload.price,
      validityDays: payload.validityDays,
      active: payload.active ?? true,
      imageUrl: payload.imageUrl ?? null,
    },
  });

  return normalizePackage(pkg);
}

export async function updateAdminPackage(packageId: string, payload: PackageUpdateInput) {
  if (!isValidUUID(packageId)) {
    throw new ApiError('BAD_REQUEST', 400, 'Invalid package id');
  }

  const pkg = await prisma.package.update({
    where: { id: packageId },
    data: {
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
      ...(payload.times !== undefined ? { times: payload.times } : {}),
      ...(payload.price !== undefined ? { price: payload.price } : {}),
      ...(payload.validityDays !== undefined ? { validityDays: payload.validityDays } : {}),
      ...(payload.active !== undefined ? { active: payload.active } : {}),
      ...(payload.imageUrl !== undefined ? { imageUrl: payload.imageUrl } : {}),
    },
  });

  return normalizePackage(pkg);
}

export async function setAdminPackageStatus(packageId: string, active: boolean) {
  return updateAdminPackage(packageId, { active });
}

export async function deleteAdminPackage(packageId: string) {
  if (!isValidUUID(packageId)) {
    throw new ApiError('BAD_REQUEST', 400, 'Invalid package id');
  }

  const [userPackageCount, paymentCount] = await Promise.all([
    prisma.userPackage.count({ where: { packageId } }),
    prisma.payment.count({ where: { packageId } }),
  ]);

  if (userPackageCount > 0 || paymentCount > 0) {
    throw new ApiError('CONFLICT', 409, 'Package has existing purchases and cannot be deleted');
  }

  await prisma.package.delete({ where: { id: packageId } });
}

export async function listPackagePurchases(filters: PurchaseFilters) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (filters.userId) where.userId = filters.userId;
  if (filters.packageId) where.packageId = filters.packageId;

  if (filters.startDate || filters.endDate) {
    const start = filters.startDate ? new Date(filters.startDate) : undefined;
    const end = filters.endDate ? new Date(filters.endDate) : undefined;
    if (start && Number.isNaN(start.getTime())) {
      throw new ApiError('BAD_REQUEST', 400, 'Invalid startDate');
    }
    if (end && Number.isNaN(end.getTime())) {
      throw new ApiError('BAD_REQUEST', 400, 'Invalid endDate');
    }
    where.createdAt = {
      ...(start ? { gte: start } : {}),
      ...(end ? { lte: end } : {}),
    };
  }

  const [records, total] = await Promise.all([
    prisma.userPackage.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        package: { select: { id: true, name: true, times: true, price: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.userPackage.count({ where }),
  ]);

  return {
    purchases: records.map(normalizeUserPackage),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
