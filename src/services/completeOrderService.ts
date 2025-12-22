/**
 * Complete Order Service
 * Handles order completion logic
 */

import { completeOrderAction } from '@/actions/orders.actions';

export async function completeOrder(
  orderId: string,
  notes?: string
): Promise<{ data: any; error: string | null }> {
  try {
    const data = await completeOrderAction(orderId, notes);
    return { data, error: null };
  } catch (error: any) {
    console.error('Failed to complete order:', error);
    return { data: null, error: error.message || 'Failed to complete order' };
  }
}
