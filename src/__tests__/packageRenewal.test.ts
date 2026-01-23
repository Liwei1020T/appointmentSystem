import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    userPackage: {
      findFirst: vi.fn(),
    },
    package: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { getRenewalDiscountForUser } from '@/server/services/package.service';

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
});
