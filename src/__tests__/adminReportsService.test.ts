import { afterEach, describe, expect, it, vi } from 'vitest';

import { exportReportData, getRevenueReport } from '@/services/adminReportsService';

describe('adminReportsService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns API error message when revenue report request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: {
            message: 'Revenue report failed',
          },
        }),
      })
    );

    const result = await getRevenueReport({ period: 'month' });

    expect(result.error).toBe('Revenue report failed');
    expect(result.data.totalRevenue).toBe(0);
    expect(result.data.revenueByDay).toEqual([]);
  });

  it('returns thrown string message for export failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('Export network failed'));

    const result = await exportReportData('sales');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Export network failed');
  });
});
