import { beforeEach, describe, expect, it, vi } from 'vitest';

const cachedRequestMock = vi.fn();

vi.mock('@/services/requestCache', () => ({
  cachedRequest: (...args: unknown[]) => cachedRequestMock(...args),
  invalidateRequestCacheByPrefix: vi.fn(),
}));

import {
  createCashPayment,
  createPayment,
  getPendingPayments,
} from '@/services/paymentService';

describe('paymentService', () => {
  beforeEach(() => {
    cachedRequestMock.mockReset();
    cachedRequestMock.mockImplementation((_key: string, fetcher: () => Promise<unknown>) => fetcher());
    vi.unstubAllGlobals();
  });

  it('normalizes malformed pending payments payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            payments: 'invalid',
            pagination: {
              page: '1',
              limit: '10',
              total: '7',
              totalPages: '1',
            },
          },
        }),
      })
    );

    const result = await getPendingPayments();

    expect(result.payments).toEqual([]);
    expect(result.pagination.total).toBe(7);
    expect(result.pagination.totalPages).toBe(1);
  });

  it('returns thrown string when createPayment fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('Payment gateway offline'));

    const result = await createPayment('order-1', 'tng');

    expect(result.error).toBe('Payment gateway offline');
  });

  it('returns thrown string when createCashPayment fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('Cash channel unavailable'));

    const result = await createCashPayment('order-1', 88);

    expect(result.error).toBe('Cash channel unavailable');
  });
});
