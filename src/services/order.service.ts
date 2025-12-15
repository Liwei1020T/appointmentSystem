/**
 * Order Service - Prisma 迁移版本
 * 替代原来的 Supabase client 调用
 */

import { Order } from '.prisma/client';

export interface CreateOrderData {
  stringId: string;
  userPackageId?: string;
  voucherCode?: string;
  scheduledDate: string;
  scheduledTime: string;
  notes?: string;
}

export interface OrderWithDetails extends Omit<Order, 'createdAt' | 'updatedAt' | 'discountAmount' | 'usePackage'> {
  final_price?: number;
  finalPrice?: number;
  use_package?: boolean;
  usePackage?: boolean;
  discount_amount?: number;
  discountAmount?: number | null;
  created_at?: string | Date;
  createdAt: Date | string;
  updated_at?: string | Date;
  updatedAt?: Date | string;
  payment_status?: string;
  paymentStatus?: string;
  string?: any;
  payments?: any[];
  packageUsed?: any;
  voucherUsed?: any;
}

/**
 * 获取用户订单列表
 */
export async function getUserOrders(
  status?: string,
  limit?: number
): Promise<{ data?: OrderWithDetails[]; error?: any }> {
  try {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());

    const response = await fetch(`/api/orders?${params.toString()}`);
    const result = await response.json();

    if (!response.ok) {
      return { error: new Error(result.error || '获取订单失败') };
    }

    return { data: result.data };
  } catch (error: any) {
    return { error };
  }
}

/**
 * 获取单个订单详情
 */
export async function getOrderById(orderId: string): Promise<OrderWithDetails> {
  const response = await fetch(`/api/orders/${orderId}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '获取订单失败');
  }

  return data.data;
}

/**
 * 创建订单
 */
export async function createOrder(orderData: CreateOrderData): Promise<any> {
  const response = await fetch('/api/orders/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '创建订单失败');
  }

  return data.data;
}

/**
 * 取消订单
 */
export async function cancelOrder(orderId: string): Promise<void> {
  const response = await fetch(`/api/orders/${orderId}/cancel`, {
    method: 'POST',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '取消订单失败');
  }
}

/**
 * 完成订单（管理员）
 */
export async function completeOrder(orderId: string, photos?: string[]): Promise<void> {
  const response = await fetch(`/api/orders/${orderId}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ photos }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '完成订单失败');
  }
}

/**
 * 获取订单历史（带分页）
 */
export async function getOrderHistory(page = 1, pageSize = 10) {
  const response = await fetch(`/api/orders?page=${page}&limit=${pageSize}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '获取订单历史失败');
  }

  return data.data;
}
