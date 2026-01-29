import { describe, expect, it } from 'vitest';
import { summarizePromotionUsage } from '@/server/services/promotion.service';

describe('summarizePromotionUsage', () => {
  it('sums total saved amount', () => {
    const usages = [{ savedAmount: 5 }, { savedAmount: 10 }];
    const result = summarizePromotionUsage(usages);

    expect(result.totalSavedAmount).toBe(15);
  });
});
