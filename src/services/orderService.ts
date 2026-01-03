/**
 * Order Service - API client
 * Wraps order-related API routes for client usage.
 */

import type { Order } from '.prisma/client';
import { apiRequest } from '@/services/apiClient';

// 服务类型：到店自取 | 上门取送
export type ServiceType = 'in_store' | 'pickup_delivery';

export interface CreateOrderData {
  stringId?: string;
  tension: number;
  price?: number;
  costPrice?: number;
  discountAmount?: number;
  finalPrice: number;
  usePackage?: boolean;
  voucherId?: string | null;
  notes?: string;
}

export interface CreateOrderWithPackageData {
  stringId: string;
  tension: number;
  usePackage?: boolean;
  packageId?: string;
  voucherId?: string;
  notes?: string;
}

export interface OrderItemPayload {
  stringId: string;
  tensionVertical: number;
  tensionHorizontal: number;
  racketBrand?: string;
  racketModel?: string;
  racketPhoto: string;
  notes?: string;
}

export interface CreateMultiRacketOrderData {
  items: OrderItemPayload[];
  usePackage?: boolean;
  packageId?: string;
  voucherId?: string;
  notes?: string;
  serviceType?: ServiceType;
  pickupAddress?: string;
}

export interface OrderWithDetails
  extends Omit<Order, 'createdAt' | 'updatedAt' | 'discountAmount' | 'usePackage'> {
  finalPrice?: number;
  usePackage?: boolean;
  discountAmount?: number | null;
  createdAt: Date | string;
  updatedAt?: Date | string;
  paymentStatus?: string;
  string?: any;
  payments?: any[];
  packageUsed?: any;
  voucherUsed?: any;
  items?: any[];
}

/**
 * Fetch user orders with optional filtering.
 */
export async function getUserOrders(
  status?: string,
  limit?: number,
  page?: number
): Promise<{ data?: OrderWithDetails[]; error?: unknown }> {
  try {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (limit) params.set('limit', String(limit));
    if (page) params.set('page', String(page));
    const query = params.toString();
    const url = query ? `/api/orders?${query}` : '/api/orders';
    const data = await apiRequest<OrderWithDetails[]>(url);
    return { data };
  } catch (error) {
    return { error };
  }
}

/**
 * Fetch a single order detail.
 */
export async function getOrderById(orderId: string): Promise<OrderWithDetails> {
  return apiRequest<OrderWithDetails>(`/api/orders/${orderId}`);
}

/**
 * Create a single-racket order.
 */
export async function createOrder(orderData: CreateOrderData): Promise<OrderWithDetails> {
  return apiRequest<OrderWithDetails>('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
}

/**
 * Create an order using the legacy package/voucher flow.
 */
export async function createOrderWithPackage(orderData: CreateOrderWithPackageData): Promise<{
  orderId: string;
  finalPrice: number;
  paymentRequired: boolean;
}> {
  return apiRequest('/api/orders/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
}

/**
 * Create a multi-racket order in a single payload.
 */
export async function createMultiRacketOrder(payload: CreateMultiRacketOrderData): Promise<{
  orderId: string;
  racketCount: number;
  finalPrice: number;
  paymentRequired: boolean;
  order?: OrderWithDetails;
}> {
  return apiRequest('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

/**
 * Cancel a pending order.
 */
export async function cancelOrder(orderId: string): Promise<void> {
  await apiRequest(`/api/orders/${orderId}/cancel`, {
    method: 'POST',
  });
}

/**
 * Complete an order (admin only).
 */
export async function completeOrder(orderId: string, adminNotes?: string) {
  return apiRequest(`/api/orders/${orderId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminNotes }),
  });
}

/**
 * Paginated order history helper.
 */
export async function getOrderHistory(page = 1, pageSize = 10) {
  return getUserOrders(undefined, pageSize, page);
}
