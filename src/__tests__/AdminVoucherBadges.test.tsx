import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AdminVoucherListPage from '@/components/admin/AdminVoucherListPage';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/services/adminVoucherService', () => ({
  getAllVouchers: vi.fn().mockResolvedValue({
    vouchers: [
      {
        id: 'v-1',
        code: 'WELCOME5',
        type: 'fixed_amount',
        value: 5,
        active: true,
        isAutoIssue: true,
        isFirstOrderOnly: true,
      },
    ],
    error: null,
  }),
  getVoucherStats: vi.fn().mockResolvedValue({ stats: null }),
  createVoucher: vi.fn(),
  updateVoucher: vi.fn(),
  deleteVoucher: vi.fn(),
  toggleVoucherStatus: vi.fn(),
}));

describe('AdminVoucherListPage badges', () => {
  it('shows auto-issue and first-order badges', async () => {
    render(<AdminVoucherListPage />);
    expect(await screen.findByText('自动发放')).toBeInTheDocument();
    expect(await screen.findByText('首单专属')).toBeInTheDocument();
  });
});
