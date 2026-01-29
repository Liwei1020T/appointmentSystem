/**
 * Payment Service - 统一支付服务
 * Consolidated from payment.service.ts + paymentService.ts
 */

import { apiRequest } from '@/services/apiClient';
import { cachedRequest, invalidateRequestCacheByPrefix, type RequestCacheOptions } from '@/services/requestCache';

export type PaymentMethod = 'tng' | 'fpx' | 'cash' | 'manual' | 'card';

export interface PaymentProof {
  file: File;
}

/**
 * 获取支付详情
 */
export async function getPayment(paymentId: string): Promise<any> {
  return apiRequest(`/api/payments/${paymentId}`);
}

/**
 * 上传支付凭证
 */
export async function uploadPaymentProof(
  paymentId: string,
  proof: File
): Promise<string> {
  const formData = new FormData();
  formData.append('proof', proof);

  const response = await fetch(`/api/payments/${paymentId}/proof`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error?.message || data?.error || 'Failed to upload payment proof');
  }

  return data?.data?.proofUrl || data?.proofUrl;
}

/**
 * 管理员 - 获取待审核支付列表
 */
export async function getPendingPayments(
  page = 1,
  limit = 20,
  options?: RequestCacheOptions
): Promise<any> {
  const cacheKey = `admin:payments:pending:${page}:${limit}`;
  return cachedRequest(
    cacheKey,
    () => apiRequest(`/api/admin/payments/pending?page=${page}&limit=${limit}`),
    { ttlMs: 10000, skipCache: options?.skipCache }
  );
}

/**
 * 管理员 - 确认支付
 */
export async function confirmPayment(
  paymentId: string,
  transactionId?: string,
  notes?: string
): Promise<void> {
  await apiRequest(`/api/payments/${paymentId}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactionId, notes }),
  });
  invalidateRequestCacheByPrefix('admin:payments:pending');
}

/**
 * 管理员 - 拒绝支付
 */
export async function rejectPayment(
  paymentId: string,
  reason: string
): Promise<void> {
  await apiRequest(`/api/payments/${paymentId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  invalidateRequestCacheByPrefix('admin:payments:pending');
}

/**
 * 获取支付状态文本
 */
export function getPaymentStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '待支付',
    pending_verification: '待审核',
    success: '已支付',
    completed: '已支付',
    failed: '失败',
    rejected: '已拒绝',
    cancelled: '已取消',
  };
  return statusMap[status] || status;
}

/**
 * 获取支付状态颜色
 */
export function getPaymentStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    pending: 'yellow',
    pending_verification: 'blue',
    success: 'green',
    completed: 'green',
    failed: 'red',
    rejected: 'red',
    cancelled: 'gray',
  };
  return colorMap[status] || 'gray';
}

/**
 * 创建支付记录
 * 支持两种调用方式:
 * - createPayment(orderId, paymentMethod)
 * - createPayment(amount, paymentMethod, orderId)
 */
export async function createPayment(
  orderIdOrAmount: string | number,
  paymentMethod: string,
  orderId?: string
): Promise<{ paymentId: string | null; payment: { id: string } | null; error: string | null }> {
  try {
    const body = typeof orderIdOrAmount === 'number' || !isNaN(Number(orderIdOrAmount))
      ? { amount: orderIdOrAmount, paymentMethod, orderId }
      : { orderId: orderIdOrAmount, paymentMethod };

    const payment = await apiRequest<{ id: string }>(`/api/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Number(body.amount),
        orderId: body.orderId || null,
        paymentMethod: body.paymentMethod,
      }),
    });
    const id = payment?.id || null;
    return { paymentId: id, payment: id ? { id } : null, error: null };
  } catch (error: any) {
    return { paymentId: null, payment: null, error: error.message || 'Failed to create payment' };
  }
}

/**
 * 创建现金支付记录
 */
export async function createCashPayment(orderId: string, amount: number): Promise<{ payment: any; error: string | null }> {
  try {
    const payment = await apiRequest(`/api/payments/cash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, amount }),
    });
    return { payment, error: null };
  } catch (error: any) {
    return { payment: null, error: error.message || '现金支付处理失败' };
  }
}

/**
 * 上传支付收据
 * 支持两种调用方式:
 * - uploadPaymentReceipt(paymentId, file) - 上传文件
 * - uploadPaymentReceipt(paymentId, url) - 使用已上传的 URL
 */
export async function uploadPaymentReceipt(
  paymentId: string,
  fileOrUrl: File | string
): Promise<{ url: string | null; error: string | null }> {
  try {
    if (typeof fileOrUrl === 'string') {
      await apiRequest(`/api/payments/${paymentId}/receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptUrl: fileOrUrl }),
      });
      return { url: fileOrUrl, error: null };
    }

    return { url: null, error: '请先上传收据并传入 URL' };
  } catch (error: any) {
    return { url: null, error: error.message || 'Failed to upload receipt' };
  }
}

/**
 * 管理员 - 确认现金支付
 */
export async function confirmCashPayment(paymentId: string): Promise<void> {
  await apiRequest(`/api/payments/${paymentId}/verify`, {
    method: 'POST',
  });
  invalidateRequestCacheByPrefix('admin:payments:pending');
}

/**
 * 验证支付收据（管理员）
 */
export async function verifyPaymentReceipt(
  paymentId: string,
  approved: boolean,
  notes?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    if (approved) {
      await confirmPayment(paymentId, undefined, notes);
    } else {
      await rejectPayment(paymentId, notes || 'Receipt review failed');
    }
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to verify receipt' };
  }
}

/**
 * 模拟支付（测试用）
 */
export async function simulatePayment(
  orderId: string,
  amount: number
): Promise<{ success: boolean; transactionId: string | null }> {
  try {
    // Simulate payment processing (development only)
    console.info(`[DEV] Simulating payment for order ${orderId}, amount: ${amount}`);
    return { success: true, transactionId: `SIM_${Date.now()}` };
  } catch (error) {
    console.error('Payment simulation failed:', error);
    return { success: false, transactionId: null };
  }
}
