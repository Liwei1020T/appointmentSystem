import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    userPackage: {
      findFirst: vi.fn(),
    },
    package: {
      findUnique: vi.fn(),
    },
    payment: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { applyRenewalDiscount, buyPackage, getRenewalDiscountForUser } from '@/server/services/package.service';

describe('getRenewalDiscountForUser', () => {
  it('returns discount when package expires within 7 days', async () => {
    (prisma.package.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      renewalDiscount: 5,
    });
    (prisma.userPackage.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      expiry: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    });

    await expect(getRenewalDiscountForUser('user-1', 'pkg-1')).resolves.toBe(5);
  });

  it('returns discounted price when discount is present', () => {
    expect(applyRenewalDiscount(100, 5)).toBe(95);
  });

  it('applies renewal discount to payment amount', async () => {
    const packageId = '22222222-2222-4222-8222-222222222222';
    (prisma.package.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: packageId,
      name: '基础套餐',
      price: 100,
      times: 5,
      validityDays: 30,
      active: true,
      isFirstOrderOnly: false,
      renewalDiscount: 10,
    });
    (prisma.userPackage.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      expiry: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    });
    (prisma.payment.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'payment-1',
    });

    const result = await buyPackage({ id: 'user-1' }, { packageId });
    expect(result.amount).toBe(90);
  });
});
