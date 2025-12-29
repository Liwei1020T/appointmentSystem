import PaymentResultPage from '@/features/payment/PaymentResultPage';
import PageLoading from '@/components/loading/PageLoading';
import { Suspense } from 'react';

export const metadata = {
  title: '支付结果 | String Service Platform',
  description: '查看支付结果',
};

export default function PaymentPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <PaymentResultPage />
    </Suspense>
  );
}
