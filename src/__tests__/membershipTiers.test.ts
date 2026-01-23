import { describe, expect, it } from 'vitest';
import { getTierLabel } from '@/lib/membership';

describe('getTierLabel', () => {
  it('maps DB tiers to labels', () => {
    expect(getTierLabel('SILVER')).toBe('Silver');
  });
});
