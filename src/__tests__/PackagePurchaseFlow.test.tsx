import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const { buyPackageMock, getPackageByIdMock, sessionMock } = vi.hoisted(() => ({
  buyPackageMock: vi.fn(),
  getPackageByIdMock: vi.fn(),
  sessionMock: {
    data: { user: { id: 'user-1' } },
    status: 'authenticated',
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams('id=package-1'),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => sessionMock,
}));

vi.mock('@/services/packageService', () => ({
  buyPackage: (...args: unknown[]) => buyPackageMock(...args),
  getPackageById: (...args: unknown[]) => getPackageByIdMock(...args),
}));

vi.mock('@/services/paymentService', () => ({
  uploadPaymentReceipt: vi.fn(),
}));

vi.mock('@/components/PaymentReceiptUploader', () => ({
  default: () => <div data-testid="receipt-uploader" />,
}));

vi.mock('@/components/TngQRCodeDisplay', () => ({
  default: ({ amount }: { amount: number }) => (
    <div data-testid="tng-amount">RM {amount.toFixed(2)}</div>
  ),
}));

import PackagePurchaseFlow from '@/features/packages/PackagePurchaseFlow';

describe('PackagePurchaseFlow', () => {
  it('uses the discounted amount from the purchase response for TNG payment', async () => {
    const mockPackage = {
      id: 'package-1',
      name: '测试套餐',
      description: '测试套餐描述',
      price: 100,
      times: 5,
      validityDays: 30,
    };

    getPackageByIdMock.mockResolvedValue({
      package: mockPackage,
      error: null,
    });

    buyPackageMock.mockResolvedValue({
      paymentId: 'payment-1',
      amount: 90,
      originalAmount: 100,
      renewalDiscount: 10,
    });

    render(<PackagePurchaseFlow />);

    await waitFor(() => {
      expect(getPackageByIdMock).toHaveBeenCalled();
    });
    await screen.findByText('确认套餐信息');
    fireEvent.click(screen.getByText('下一步'));

    await screen.findByText('选择支付方式');
    fireEvent.click(screen.getByText('确认支付'));

    await screen.findByText('TNG 线上支付');
    expect(screen.getByTestId('tng-amount')).toHaveTextContent('RM 90.00');
  });
});
