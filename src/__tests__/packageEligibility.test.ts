import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      count: vi.fn(),
    },
    package: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    payment: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { buyPackage, isUserEligibleForFirstOrderPackage, listAvailablePackages } from '@/server/services/package.service';

describe('isUserEligibleForFirstOrderPackage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when user has no completed or in-progress orders', async () => {
    (prisma.order.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    await expect(isUserEligibleForFirstOrderPackage('user-1')).resolves.toBe(true);
  });

  it('returns false when user has completed or in-progress orders', async () => {
    (prisma.order.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    await expect(isUserEligibleForFirstOrderPackage('user-1')).resolves.toBe(false);
  });

  it('filters first-order-only packages for ineligible users', async () => {
    const allPackages = [
      { id: 'pkg-1', name: '首单特价', isFirstOrderOnly: true },
      { id: 'pkg-2', name: '基础套餐', isFirstOrderOnly: false },
    ];

    (prisma.order.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    (prisma.package.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(allPackages);

    const result = await listAvailablePackages('user-1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('pkg-2');
  });

  it('returns all packages for eligible users', async () => {
    const allPackages = [
      { id: 'pkg-1', name: '首单特价', isFirstOrderOnly: true },
      { id: 'pkg-2', name: '基础套餐', isFirstOrderOnly: false },
    ];

    (prisma.order.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    (prisma.package.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(allPackages);

    const result = await listAvailablePackages('user-1');
    expect(result).toHaveLength(2);
  });

  it('rejects first-order-only package purchase for ineligible users', async () => {
    const packageId = '11111111-1111-4111-8111-111111111111';
    (prisma.order.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    (prisma.package.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: packageId,
      name: '首单特价',
      price: 18,
      times: 1,
      validityDays: 30,
      active: true,
      isFirstOrderOnly: true,
    });
    (prisma.payment.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'payment-1',
    });

    await expect(buyPackage({ id: 'user-1' }, { packageId })).rejects.toThrow('首单');
  });
});
