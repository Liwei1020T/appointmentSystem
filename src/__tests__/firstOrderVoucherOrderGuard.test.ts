import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: { count: vi.fn() },
    stringInventory: { findUnique: vi.fn() },
    userVoucher: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/server/services/order-eta.service', () => ({
  calculateEstimatedCompletion: vi.fn().mockResolvedValue(new Date()),
}));

import { prisma } from '@/lib/prisma';
import { createOrderWithPackage } from '@/server/services/order.service';

type OrderTransactionClient = {
  order: { create: ReturnType<typeof vi.fn> };
  userVoucher: { update: ReturnType<typeof vi.fn> };
  payment: { create: ReturnType<typeof vi.fn> };
  userPackage: { update: ReturnType<typeof vi.fn> };
};

describe('createOrderWithPackage first-order voucher guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects first-order-only voucher for non-first user', async () => {
    (prisma.order.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    (prisma.stringInventory.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'string-1',
      stock: 20,
      costPrice: 10,
    });
    (prisma.userVoucher.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'uv-1',
      userId: 'user-1',
      status: 'active',
      expiry: new Date(Date.now() + 86400000),
      voucher: {
        isFirstOrderOnly: true,
        type: 'fixed_amount',
        value: 5,
        minPurchase: 0,
        validFrom: new Date(Date.now() - 86400000),
        validUntil: new Date(Date.now() + 86400000),
      },
    });
    const transactionClient: OrderTransactionClient = {
      order: { create: vi.fn().mockResolvedValue({ id: 'order-1' }) },
      userVoucher: { update: vi.fn() },
      payment: { create: vi.fn() },
      userPackage: { update: vi.fn() },
    };
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (fn: (tx: OrderTransactionClient) => unknown) => fn(transactionClient)
    );

    await expect(
      createOrderWithPackage(
        { id: 'user-1', role: 'customer', fullName: 'Test' },
        {
          stringId: 'string-1',
          tension: 24,
          voucherId: 'uv-1',
        }
      )
    ).rejects.toThrow('首单');
  });

  it('returns voucher date error before first-order check', async () => {
    (prisma.order.count as ReturnType<typeof vi.fn>).mockResolvedValue(2);
    (prisma.stringInventory.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'string-1',
      stock: 20,
      costPrice: 10,
    });
    (prisma.userVoucher.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'uv-2',
      userId: 'user-1',
      status: 'active',
      expiry: new Date(Date.now() + 86400000),
      voucher: {
        isFirstOrderOnly: true,
        type: 'fixed_amount',
        value: 5,
        minPurchase: 0,
        validFrom: new Date(Date.now() - 86400000 * 10),
        validUntil: new Date(Date.now() - 86400000),
      },
    });
    const transactionClient: OrderTransactionClient = {
      order: { create: vi.fn().mockResolvedValue({ id: 'order-2' }) },
      userVoucher: { update: vi.fn() },
      payment: { create: vi.fn() },
      userPackage: { update: vi.fn() },
    };
    (prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      async (fn: (tx: OrderTransactionClient) => unknown) => fn(transactionClient)
    );

    await expect(
      createOrderWithPackage(
        { id: 'user-1', role: 'customer', fullName: 'Test' },
        {
          stringId: 'string-1',
          tension: 24,
          voucherId: 'uv-2',
        }
      )
    ).rejects.toThrow('Voucher not valid');
  });
});
