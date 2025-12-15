/**
 * Admin Voucher Detail Route
 * /admin/vouchers/[id]
 * 
 * Phase 3.5: Admin Voucher Management
 */

import AdminVoucherDetailPage from '@/components/admin/AdminVoucherDetailPage';

interface AdminVoucherDetailRouteProps {
  params: {
    id: string;
  };
}

export default function AdminVoucherDetailRoute({ params }: AdminVoucherDetailRouteProps) {
  return <AdminVoucherDetailPage voucherId={params.id} />;
}
