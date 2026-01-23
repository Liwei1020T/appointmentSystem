import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { getOrderByIdMock } = vi.hoisted(() => ({
  getOrderByIdMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useParams: () => ({ id: 'order-1' }),
}));

vi.mock('@/services/adminOrderService', () => ({
  getOrderById: (...args: unknown[]) => getOrderByIdMock(...args),
  updateOrderStatus: vi.fn(),
  updateOrderPhotos: vi.fn(),
}));

vi.mock('@/services/paymentService', () => ({
  confirmCashPayment: vi.fn(),
  confirmPayment: vi.fn(),
  verifyPaymentReceipt: vi.fn(),
}));

vi.mock('@/services/completeOrderService', () => ({
  completeOrder: vi.fn(),
}));

vi.mock('@/components/admin/AdminOrderProgress', () => ({
  default: () => <div data-testid="admin-order-progress" />,
}));

vi.mock('@/components/admin/OrderPhotosUploader', () => ({
  default: () => <div data-testid="order-photos-uploader" />,
}));

vi.mock('@/components/OrderPhotosUpload', () => ({
  default: () => <div data-testid="order-photos-upload" />,
}));

vi.mock('@/components/admin/PaymentReceiptVerifier', () => ({
  default: () => <div data-testid="payment-receipt-verifier" />,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import AdminOrderDetailPage from '@/components/admin/AdminOrderDetailPage';

describe('AdminOrderDetailPage', () => {
  it('shows order status notes section', async () => {
    getOrderByIdMock.mockResolvedValue({
      order: {
        id: 'order-1',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: {
          full_name: 'Test User',
          phone: '0123456789',
          email: 'test@example.com',
        },
        string: {
          model: 'BG66',
          brand: 'YONEX',
          price: 30,
        },
        total_price: 30,
        price: 30,
        payments: [],
      },
      error: null,
    });

    render(<AdminOrderDetailPage />);

    expect(await screen.findByText('状态备注')).toBeInTheDocument();
  });
});
