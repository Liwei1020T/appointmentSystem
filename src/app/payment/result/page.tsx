import PaymentResultPage from '@/features/payment/PaymentResultPage';
import { Suspense } from 'react';

export const metadata = {
  title: '支付结果 | String Service Platform',
  description: '查看支付结果',
};

export default function PaymentPage() {
  return (
    <Suspense fallback={null}>
      <PaymentResultPage />
    </Suspense>
  );
}
