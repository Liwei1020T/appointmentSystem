/**
 * Admin Order Service
 * 管理员订单管理功能
 */

import {
  getAdminOrderByIdAction,
  getAdminOrderStatsAction,
  getAdminOrdersAction,
  updateAdminOrderStatusAction,
} from '@/actions/admin-orders.actions';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'in_progress'
  | 'ready'
  | 'completed'
  | 'cancelled';

export interface AdminOrder {
  id: string;
  userId: string;
  packageId: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date;
  created_at?: Date;
  updatedAt?: Date;
  updated_at?: Date;
  completed_at?: Date;
  user?: {
    fullName: string;
    full_name?: string;
    email: string;
    phone: string;
  };
  package?: {
    name: string;
    type: string;
  };
  payment?: {
    id: string;
    method: string;
    payment_method?: string;
    status: string;
    payment_status?: string;
    amount: number;
    receiptUrl?: string;
    receipt_url?: string;
    paid_at?: Date;
    metadata?: Record<string, unknown>;
  };
  photos?: string[];
  adminNotes?: string;
  stringInventory?: {
    brand: string;
    model: string;
  };
  string?: {
    name: string;
    brand: string;
    price: number;
    model?: string;
  };
  // Order details
  /**
   * 订单拉力（历史字段：单一拉力）
   * - 新结构可能使用 tension_horizontal / tension_vertical
   */
  tension?: number;
  tension_horizontal?: number;
  tension_vertical?: number;
  racket_brand?: string;
  racket_model?: string;
  notes?: string;
  voucher_discount?: number;
  total_price?: number;
}

export async function getAllOrders(filters?: {
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<{ orders: AdminOrder[]; total: number; error: { message: string } | null }> {
  try {
    const payload = await getAdminOrdersAction({
      status: filters?.status,
      q: undefined,
      page: filters?.page,
      limit: filters?.limit,
    });
    return { orders: payload.orders || [], total: payload.pagination?.total || 0, error: null };
  } catch (error: any) {
    console.error('Failed to fetch orders:', error);
    return { orders: [], total: 0, error: { message: error.message || 'Failed to fetch orders' } };
  }
}

export async function getOrderById(orderId: string): Promise<{ order: AdminOrder | null; error: { message: string } | null }> {
  try {
    const order = await getAdminOrderByIdAction(orderId);
    return { order, error: null };
  } catch (error: any) {
    console.error('Failed to fetch order:', error);
    return { order: null, error: { message: error.message || 'Failed to fetch order' } };
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  notes?: string
): Promise<{ order: AdminOrder | null; error: { message: string } | null }> {
  try {
    const order = await updateAdminOrderStatusAction(orderId, status, notes);
    return { order, error: null };
  } catch (error: any) {
    console.error('Failed to update order status:', error);
    return { order: null, error: { message: error.message || 'Failed to update order status' } };
  }
}

export async function assignOrderPhotographer(
  orderId: string,
  photographerId: string
): Promise<boolean> {
  try {
    const response = await fetch(`/api/admin/orders/${orderId}/assign`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photographerId }),
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to assign photographer:', error);
    return false;
  }
}

export interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  processing?: number;
  in_progress?: number;
  ready?: number;
  completed: number;
  cancelled: number;
  revenue: number;
  todayTotal?: number;
  todayRevenue?: number;
}

/**
 * 获取订单统计
 */
export async function getOrderStats(filters?: {
  startDate?: string;
  endDate?: string;
}): Promise<{ stats: OrderStats | null; error: string | null }> {
  try {
    const stats = await getAdminOrderStatsAction({
      startDate: filters?.startDate,
      endDate: filters?.endDate,
    });
    return { stats: stats as OrderStats, error: null };
  } catch (error: any) {
    return { stats: null, error: error.message || 'Failed to fetch order stats' };
  }
}

/**
 * 搜索订单
 */
export async function searchOrders(query: string, filters?: {
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<{ orders: AdminOrder[]; total?: number; error: { message: string } | null }> {
  try {
    const payload = await getAdminOrdersAction({
      q: query,
      status: filters?.status,
      page: filters?.page,
      limit: filters?.limit,
    });
    return { orders: payload.orders || [], total: payload.pagination?.total || 0, error: null };
  } catch (error: any) {
    return { orders: [], total: 0, error: { message: error.message || 'Failed to search orders' } };
  }
}

/**
 * 更新订单照片
 */
export async function updateOrderPhotos(
  orderId: string,
  photos: string[]
): Promise<{ success: boolean; error: string | null }> {
  try {
    const response = await fetch(`/api/admin/orders/${orderId}/photos`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photos }),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to update order photos' };
    }
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update order photos' };
  }
}
