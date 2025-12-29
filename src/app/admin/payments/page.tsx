import dynamic from 'next/dynamic';
import SessionProvider from '@/components/providers/SessionProvider';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PageLoading from '@/components/loading/PageLoading';

const PaymentVerificationPage = dynamic(() => import('@/components/admin/PaymentVerificationPage'), {
  loading: () => <PageLoading surface="dark" />,
});

export default function AdminPaymentsPage() {
  return (
    <SessionProvider>
      <ProtectedRoute requireAdmin>
        <PaymentVerificationPage />
      </ProtectedRoute>
    </SessionProvider>
  );
}
