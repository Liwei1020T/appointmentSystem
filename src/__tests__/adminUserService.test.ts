import { beforeEach, describe, expect, it, vi } from 'vitest';

const cachedRequestMock = vi.fn();

vi.mock('@/services/requestCache', () => ({
  cachedRequest: (...args: unknown[]) => cachedRequestMock(...args),
  invalidateRequestCacheByPrefix: vi.fn(),
}));

vi.mock('@/services/apiClient', () => ({
  getApiErrorMessage: (_payload: unknown, fallback: string) => fallback,
}));

import { getAllUsers } from '@/services/adminUserService';

describe('adminUserService.getAllUsers', () => {
  beforeEach(() => {
    cachedRequestMock.mockReset();
    cachedRequestMock.mockImplementation((_key: string, fetcher: () => Promise<unknown>) => fetcher());
  });

  it('maps snake_case user fields from api payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            users: [
              {
                id: 'u-1',
                email: 'alice@example.com',
                phone: '+60123456789',
                points: '20',
                role: 'customer',
                full_name: 'Alice',
                referral_code: 'REF001',
                referred_by: 'REF000',
                created_at: '2026-02-10T00:00:00.000Z',
                updated_at: '2026-02-11T00:00:00.000Z',
              },
            ],
            pagination: { total: 1 },
          },
        }),
      })
    );

    const result = await getAllUsers();

    expect(result.error).toBeNull();
    expect(result.totalCount).toBe(1);
    expect(result.users[0].fullName).toBe('Alice');
    expect(result.users[0].full_name).toBe('Alice');
    expect(result.users[0].referralCode).toBe('REF001');
    expect(result.users[0].referredBy).toBe('REF000');
    expect(result.users[0].createdAt).toBe('2026-02-10T00:00:00.000Z');
    expect(result.users[0].updatedAt).toBe('2026-02-11T00:00:00.000Z');

    vi.unstubAllGlobals();
  });
});
