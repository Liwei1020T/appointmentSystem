/**
 * Admin Inventory Detail Page Route
 * 
 * Route: /admin/inventory/[id]
 * Protected admin route for viewing and editing a single string inventory item
 */

'use client';

import AdminInventoryDetailPage from '@/components/admin/AdminInventoryDetailPage';

interface InventoryDetailPageProps {
  params: {
    id: string;
  };
}

export default function InventoryDetailPage({ params }: InventoryDetailPageProps) {
  return <AdminInventoryDetailPage stringId={params.id} />;
}
