/**
 * Order Photos Service
 * Client wrapper for order photo APIs.
 */

import { apiRequest } from '@/services/apiClient';

export interface OrderPhoto {
  id: string;
  photo_url: string;
  photo_type: 'before' | 'after' | 'detail' | 'other';
  caption: string | null;
  display_order: number;
  created_at: string;
}

export async function getOrderPhotos(orderId: string): Promise<OrderPhoto[]> {
  return apiRequest<OrderPhoto[]>(`/api/orders/${orderId}/photos`);
}

export async function addOrderPhoto(params: {
  orderId: string;
  photoUrl: string;
  photoType: 'before' | 'after' | 'detail' | 'other';
  caption?: string;
  displayOrder?: number;
}): Promise<OrderPhoto> {
  const { orderId, ...payload } = params;
  return apiRequest<OrderPhoto>(`/api/orders/${orderId}/photos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function deleteOrderPhoto(orderId: string, photoId: string): Promise<void> {
  await apiRequest(`/api/orders/${orderId}/photos/${photoId}`, {
    method: 'DELETE',
  });
}

export async function reorderOrderPhotos(
  orderId: string,
  photoOrders: { id: string; displayOrder: number }[]
): Promise<void> {
  await apiRequest(`/api/orders/${orderId}/photos/reorder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photos: photoOrders }),
  });
}
