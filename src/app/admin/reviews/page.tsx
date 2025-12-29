/**
 * 管理员评价页面路由 (Admin Reviews Page Route)
 */

import dynamic from 'next/dynamic';
import PageLoading from '@/components/loading/PageLoading';

const AdminReviewsPage = dynamic(() => import('@/features/admin/AdminReviewsPage'), {
  loading: () => <PageLoading surface="dark" />,
});

export const metadata = {
  title: '评价管理 - 管理后台',
  description: '查看和管理客户评价',
};

export default function Page() {
  return <AdminReviewsPage />;
}
