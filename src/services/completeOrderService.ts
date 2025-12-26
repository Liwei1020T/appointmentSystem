/**
 * Complete Order Service
 * Wraps admin completion API for UI callers.
 */

import { apiRequest } from '@/services/apiClient';

export async function completeOrder(
  orderId: string,
  notes?: string
): Promise<{ data: any; error: string | null }> {
  try {
    const data = await apiRequest(`/api/orders/${orderId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminNotes: notes }),
    });
    return { data, error: null };
  } catch (error: any) {
    console.error('Failed to complete order:', error);
    return { data: null, error: error.message || 'Failed to complete order' };
  }
}
