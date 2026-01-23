import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: { count: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import { assertFirstOrderVoucherEligibility } from '@/server/services/welcome.service';

describe('assertFirstOrderVoucherEligibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows when voucher is not first-order-only', async () => {
    (prisma.order.count as ReturnType<typeof vi.fn>).mockResolvedValue(2);
    await expect(assertFirstOrderVoucherEligibility('user-1', false)).resolves.toBeUndefined();
  });

  it('allows when user has no prior orders', async () => {
    (prisma.order.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    await expect(assertFirstOrderVoucherEligibility('user-1', true)).resolves.toBeUndefined();
  });

  it('rejects when user already ordered', async () => {
    (prisma.order.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    await expect(assertFirstOrderVoucherEligibility('user-1', true)).rejects.toThrow('首单');
  });
});
