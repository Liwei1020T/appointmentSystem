import { describe, expect, it } from 'vitest';
import { calculateSuggestedQuantity } from '@/server/services/restock.service';

// Ensures restock calculations always suggest a positive minimum quantity.
describe('calculateSuggestedQuantity', () => {
  it('returns at least minimum restock quantity', () => {
    expect(calculateSuggestedQuantity(0, 5, 1)).toBeGreaterThan(0);
  });
});
