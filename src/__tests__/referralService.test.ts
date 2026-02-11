import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getMyReferralStats,
  getReferralLeaderboard,
  getReferralStats,
} from '@/services/referralService';

describe('referralService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns empty referrals when referral stats payload is malformed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            referralCode: 'REF-1',
            stats: {
              totalReferrals: 2,
              totalRewards: 1,
            },
            referrals: 'invalid',
          },
        }),
      })
    );

    const result = await getReferralStats();

    expect(result.referralCode).toBe('REF-1');
    expect(result.referrals).toEqual([]);
  });

  it('returns empty referrals when my stats payload referrals is malformed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            referralCode: 'MY-1',
            referralCount: 3,
            totalPoints: 180,
            pendingRewards: 1,
            referrals: { bad: true },
          },
        }),
      })
    );

    const result = await getMyReferralStats();

    expect(result.referralCode).toBe('MY-1');
    expect(result.referrals).toEqual([]);
  });

  it('normalizes leaderboard numeric and boolean fields', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            leaderboard: [
              {
                userId: 'user-1',
                fullName: 'Alice',
                referralCount: '5',
                totalPoints: '380',
                isCurrentUser: 'true',
              },
            ],
          },
        }),
      })
    );

    const result = await getReferralLeaderboard(10);

    expect(result).toHaveLength(1);
    expect(result[0].referralCount).toBe(5);
    expect(result[0].totalPoints).toBe(380);
    expect(result[0].isCurrentUser).toBe(true);
  });
});
