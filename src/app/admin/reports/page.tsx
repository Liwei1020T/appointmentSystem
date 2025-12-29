import dynamic from 'next/dynamic';
import PageLoading from '@/components/loading/PageLoading';

const AdminReportsPage = dynamic(() => import('@/components/admin/AdminReportsPage'), {
  loading: () => <PageLoading surface="dark" />,
});

/**
 * Admin Reports Route
 * Path: /admin/reports
 * 
 * Renders the comprehensive analytics dashboard
 */
export default function ReportsPage() {
  return <AdminReportsPage />;
}
