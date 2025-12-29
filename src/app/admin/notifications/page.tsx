/**
 * Admin Notifications Page Route
 * 
 * Route: /admin/notifications
 * 
 * Displays the AdminNotificationsPage component with full notification management capabilities.
 */

import dynamic from 'next/dynamic';
import PageLoading from '@/components/loading/PageLoading';

const AdminNotificationsPage = dynamic(() => import('@/components/admin/AdminNotificationsPage'), {
  loading: () => <PageLoading surface="dark" />,
});

export default function NotificationsPage() {
  return <AdminNotificationsPage />;
}
