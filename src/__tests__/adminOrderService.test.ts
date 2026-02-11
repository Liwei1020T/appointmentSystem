import { beforeEach, describe, expect, it, vi } from 'vitest';

const cachedRequestMock = vi.fn();

vi.mock('@/services/requestCache', () => ({
  cachedRequest: (...args: unknown[]) => cachedRequestMock(...args),
  invalidateRequestCacheByPrefix: vi.fn(),
}));

import { getAllOrders, getOrderById } from '@/services/adminOrderService';

describe('adminOrderService', () => {
  beforeEach(() => {
    cachedRequestMock.mockReset();
    cachedRequestMock.mockImplementation((_key: string, fetcher: () => Promise<unknown>) => fetcher());
    vi.unstubAllGlobals();
  });

  it('normalizes malformed order list payload and numeric pagination total', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            orders: 'invalid',
            pagination: {
              total: '5',
            },
          },
        }),
      })
    );

    const result = await getAllOrders();

    expect(result.error).toBeNull();
    expect(result.orders).toEqual([]);
    expect(result.total).toBe(5);
  });

  it('returns thrown string message when loading order by id fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('Order API offline'));

    const result = await getOrderById('order-1');

    expect(result.order).toBeNull();
    expect(result.error?.message).toBe('Order API offline');
  });
});
