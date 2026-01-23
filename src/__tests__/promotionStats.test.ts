import { describe, expect, it } from 'vitest';
import { summarizePromotionUsage } from '@/server/services/promotion.service';

describe('summarizePromotionUsage', () => {
  it('sums total saved amount', () => {
    const result = summarizePromotionUsage([{ savedAmount: 5 }, { savedAmount: 10 }] as any);

    expect(result.totalSavedAmount).toBe(15);
  });
});
