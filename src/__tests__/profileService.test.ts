import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiRequestMock = vi.fn();

vi.mock('@/services/apiClient', () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

import { getPoints } from '@/services/profileService';

describe('profileService.getPoints', () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it('normalizes invalid logs payload into an array', async () => {
    apiRequestMock.mockResolvedValue({
      balance: '12',
      logs: null,
    });

    const result = await getPoints();

    expect(result.balance).toBe(12);
    expect(result.logs).toEqual([]);
  });
});
