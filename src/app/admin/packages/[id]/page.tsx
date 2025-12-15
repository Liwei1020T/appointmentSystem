/**
 * Admin Package Detail Page Route
 * 
 * Route: /admin/packages/[id]
 * Protected admin route for viewing package details
 */

'use client';

import AdminPackageDetailPage from '@/components/admin/AdminPackageDetailPage';

interface PackageDetailPageProps {
  params: {
    id: string;
  };
}

export default function PackageDetailPage({ params }: PackageDetailPageProps) {
  return <AdminPackageDetailPage packageId={params.id} />;
}
