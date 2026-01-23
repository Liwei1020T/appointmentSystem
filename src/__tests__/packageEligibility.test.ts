import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      count: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { isUserEligibleForFirstOrderPackage } from '@/server/services/package.service';

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
});
