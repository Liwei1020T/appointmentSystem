import { beforeEach, describe, expect, it, vi } from 'vitest';

const cachedRequestMock = vi.fn();

vi.mock('@/services/requestCache', () => ({
  cachedRequest: (...args: unknown[]) => cachedRequestMock(...args),
  invalidateRequestCacheByPrefix: vi.fn(),
}));

import {
  getAllPackages,
  getPackagePurchaseHistory,
} from '@/services/adminPackageService';

describe('adminPackageService', () => {
  beforeEach(() => {
    cachedRequestMock.mockReset();
    cachedRequestMock.mockImplementation((_key: string, fetcher: () => Promise<unknown>) => fetcher());
    vi.unstubAllGlobals();
  });

  it('normalizes package list payload fields', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          data: [
            {
              id: 'pkg-1',
              name: 'Pro Package',
              description: 'desc',
              times: 10,
              price: '199.9',
              active: true,
              validity_days: 120,
              created_at: '2026-02-11T00:00:00.000Z',
              updated_at: '2026-02-11T01:00:00.000Z',
            },
          ],
        }),
      })
    );

    const result = await getAllPackages();

    expect(result.error).toBeNull();
    expect(result.packages).toHaveLength(1);
    expect(result.packages[0].price).toBe(199.9);
    expect(result.packages[0].validityDays).toBe(120);
    expect(result.packages[0].validity_days).toBe(120);
    expect(result.packages[0].createdAt).toBe('2026-02-11T00:00:00.000Z');
  });

  it('normalizes purchase history payload fields', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            purchases: [
              {
                id: 'up-1',
                user_id: 'user-1',
                package_id: 'pkg-1',
                remaining: '3',
                original_times: '10',
                expiry: '2026-03-01T00:00:00.000Z',
                created_at: '2026-02-11T00:00:00.000Z',
                user: {
                  full_name: 'Alice',
                  email: 'alice@example.com',
                },
                package: {
                  id: 'pkg-1',
                  name: 'Pro Package',
                  times: 10,
                  price: '120',
                },
              },
            ],
            pagination: {
              total: 1,
            },
          },
        }),
      })
    );

    const result = await getPackagePurchaseHistory({ packageId: 'pkg-1' });

    expect(result.error).toBeNull();
    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].userId).toBe('user-1');
    expect(result.data[0].remaining).toBe(3);
    expect(result.data[0].originalTimes).toBe(10);
    expect(result.data[0].user?.fullName).toBe('Alice');
    expect(result.data[0].package?.price).toBe(120);
  });
});
