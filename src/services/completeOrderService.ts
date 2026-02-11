/**
 * Complete Order Service
 * Wraps admin completion API for UI callers.
 */

import { apiRequest } from '@/services/apiClient';

export interface CompleteOrderData {
  stockDeducted: number;
  profit: number;
  pointsGranted: number;
  [key: string]: unknown;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error) {
    return error;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const { message } = error as { message?: unknown };
    if (typeof message === 'string' && message) {
      return message;
    }
  }

  return fallback;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

export async function completeOrder(
  orderId: string,
  notes?: string
): Promise<{ data: CompleteOrderData | null; error: string | null }> {
  try {
    const data = await apiRequest<Record<string, unknown>>(`/api/orders/${orderId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminNotes: notes }),
    });

    const normalized: CompleteOrderData = {
      ...data,
      stockDeducted: toNumber(data.stockDeducted),
      profit: toNumber(data.profit),
      pointsGranted: toNumber(data.pointsGranted),
    };

    return { data: normalized, error: null };
  } catch (error: unknown) {
    console.error('Failed to complete order:', error);
    return { data: null, error: getErrorMessage(error, 'Failed to complete order') };
  }
}
