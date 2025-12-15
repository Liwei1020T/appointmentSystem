/**
 * Admin User Detail Route
 * /admin/users/[id]
 * 
 * Phase 3.6: Admin User Management
 */

import AdminUserDetailPage from '@/components/admin/AdminUserDetailPage';

interface AdminUserDetailRouteProps {
  params: {
    id: string;
  };
}

export default function AdminUserDetailRoute({ params }: AdminUserDetailRouteProps) {
  return <AdminUserDetailPage userId={params.id} />;
}
