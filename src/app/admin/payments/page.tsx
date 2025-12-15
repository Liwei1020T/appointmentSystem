import SessionProvider from '@/components/providers/SessionProvider';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PaymentVerificationPage from '@/components/admin/PaymentVerificationPage';

export default function AdminPaymentsPage() {
  return (
    <SessionProvider>
      <ProtectedRoute requireAdmin>
        <PaymentVerificationPage />
      </ProtectedRoute>
    </SessionProvider>
  );
}
