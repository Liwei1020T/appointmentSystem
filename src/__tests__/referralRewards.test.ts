import { describe, it, expect } from 'vitest';
import { getReferralTier } from '@/server/services/referral.service';

describe('getReferralTier', () => {
  it('returns 50 points for 1-5 referrals', () => {
    expect(getReferralTier(1).points).toBe(50);
    expect(getReferralTier(5).points).toBe(50);
  });

  it('returns 80 points for 6-10 referrals', () => {
    expect(getReferralTier(6).points).toBe(80);
    expect(getReferralTier(10).points).toBe(80);
  });

  it('returns 100 points for 11+ referrals', () => {
    expect(getReferralTier(11).points).toBe(100);
    expect(getReferralTier(50).points).toBe(100);
  });
});
