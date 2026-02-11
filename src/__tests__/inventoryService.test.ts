import { beforeEach, describe, expect, it, vi } from 'vitest';

const cachedRequestMock = vi.fn();

vi.mock('@/services/requestCache', () => ({
  cachedRequest: (...args: unknown[]) => cachedRequestMock(...args),
  invalidateRequestCacheByPrefix: vi.fn(),
}));

import {
  adjustStock,
  getAllStrings,
  getStockHistory,
} from '@/services/inventoryService';

describe('inventoryService', () => {
  beforeEach(() => {
    cachedRequestMock.mockReset();
    cachedRequestMock.mockImplementation((_key: string, fetcher: () => Promise<unknown>) => fetcher());
    vi.unstubAllGlobals();
  });

  it('returns thrown string when adjustStock fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('Inventory API down'));

    const result = await adjustStock({
      stringId: 'string-1',
      changeAmount: 2,
      type: 'restock',
    });

    expect(result.error).toBe('Inventory API down');
  });

  it('returns thrown string when getAllStrings fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('Inventory list unavailable'));

    const result = await getAllStrings();

    expect(result.error).toBe('Inventory list unavailable');
    expect(result.strings).toEqual([]);
  });

  it('returns thrown string when getStockHistory fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('Stock history unavailable'));

    const result = await getStockHistory();

    expect(result.error).toBe('Stock history unavailable');
    expect(result.history).toEqual([]);
  });
});
