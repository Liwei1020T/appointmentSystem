import { notFound } from 'next/navigation';
import SessionProvider from '@/components/providers/SessionProvider';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PaymentPage from '@/components/payment/PaymentPage';

interface PaymentPageProps {
  params: {
    id: string;
  };
}

export default function PaymentRoute({ params }: PaymentPageProps) {
  const paymentId = params.id;

  if (!paymentId) {
    notFound();
  }

  // 注意：实际使用时需要从 API 获取支付详情
  // 这里仅作为示例，展示如何使用组件
  return (
    <SessionProvider>
      <ProtectedRoute>
        <PaymentPageWrapper paymentId={paymentId} />
      </ProtectedRoute>
    </SessionProvider>
  );
}

function PaymentPageWrapper({ paymentId }: { paymentId: string }) {
  // TODO: 从 API 获取支付详情
  // const payment = await getPayment(paymentId);
  
  // 临时示例数据
  const exampleData = {
    paymentId,
    amount: 50,
    orderId: 'example-order-id',
    userId: 'example-user-id',
  };

  return (
    <PaymentPage
      paymentId={exampleData.paymentId}
      amount={exampleData.amount}
      orderId={exampleData.orderId}
      userId={exampleData.userId}
      onProofUploaded={() => {
        window.location.href = '/orders';
      }}
    />
  );
}
