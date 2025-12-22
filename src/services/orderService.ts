/**
 * Order Service - Prisma 迁移版本
 * 替代原来的 Supabase client 调用
 */

import { Order } from '.prisma/client';
import {
  cancelOrderAction,
  completeOrderAction,
  createOrderWithPackageAction,
  getOrderByIdAction,
  getUserOrdersAction,
} from '@/actions/orders.actions';

export interface CreateOrderData {
  stringId: string;
  tension: number;
  usePackage?: boolean;
  packageId?: string;
  voucherId?: string;
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
    const data = await getUserOrdersAction({ status, limit });
    return { data };
  } catch (error: any) {
    return { error };
  }
}

/**
 * 获取单个订单详情
 */
export async function getOrderById(orderId: string): Promise<OrderWithDetails> {
  return getOrderByIdAction(orderId);
}

/**
 * 创建订单
 */
export async function createOrder(orderData: CreateOrderData): Promise<any> {
  return createOrderWithPackageAction(orderData);
}

/**
 * 取消订单
 */
export async function cancelOrder(orderId: string): Promise<void> {
  await cancelOrderAction(orderId);
}

/**
 * 完成订单（管理员）
 */
export async function completeOrder(orderId: string, photos?: string[]): Promise<void> {
  await completeOrderAction(orderId);
}

/**
 * 获取订单历史（带分页）
 */
export async function getOrderHistory(page = 1, pageSize = 10) {
  return getUserOrdersAction({ page, limit: pageSize });
}
