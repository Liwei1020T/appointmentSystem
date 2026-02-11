/**
 * Payment Service - 统一支付服务
 * Consolidated from payment.service.ts + paymentService.ts
 */

import { apiRequest } from '@/services/apiClient';
import { cachedRequest, invalidateRequestCacheByPrefix, type RequestCacheOptions } from '@/services/requestCache';
import { AppError } from '@/lib/api-errors';

export type PaymentMethod = 'tng' | 'fpx' | 'cash' | 'manual' | 'card';

export interface PaymentProof {
  file: File;
}

interface PendingPaymentsPayload {
  payments?: unknown;
  pagination?: {
    page?: unknown;
    limit?: unknown;
    total?: unknown;
    totalPages?: unknown;
  } | null;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  status: string;
  provider: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  user?: {
    id: string;
    fullName: string | null;
    email: string;
    phone: string | null;
  };
  order?: {
    id: string;
    string: {
      brand: string;
      model: string;
    } | null;
  } | null;
  package?: {
    id: string;
    name: string;
    times: number;
    validityDays: number;
    price: number;
  } | null;
}

export interface PendingPaymentsResult {
  payments: PendingPayment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaymentDetail {
  id: string;
  amount: number;
  status: string;
  provider: string;
  metadata?: Record<string, unknown>;
}

export interface PendingPayment {
  id: string;
  amount: number;
  status: string;
  provider: string;
  metadata?: Record<string, unknown>;
  createdAt: string | Date;
  user: {
    id: string;
    fullName: string | null;
    email: string;
    phone: string | null;
  };
  order: {
    id: string;
    string: {
      brand: string;
      model: string;
    } | null;
  } | null;
  package: {
    id: string;
    name: string;
    times: number;
    validityDays: number;
    price: number | string;
  } | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
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

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error) {
    return error;
  }

  if (isRecord(error) && typeof error.message === 'string' && error.message) {
    return error.message;
  }

  return fallback;
}

function normalizePaymentDetail(value: unknown): PaymentDetail | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    id: toString(value.id),
    amount: toNumber(value.amount),
    status: toString(value.status),
    provider: toString(value.provider),
    metadata: isRecord(value.metadata) ? value.metadata : undefined,
  };
}

function normalizePendingPayment(value: unknown): PendingPayment | null {
  if (!isRecord(value)) {
    return null;
  }

  const user = isRecord(value.user)
    ? {
        id: toString(value.user.id),
        fullName: toNullableString(value.user.fullName),
        email: toString(value.user.email),
        phone: toNullableString(value.user.phone),
      }
    : {
        id: '',
        fullName: null,
        email: '',
        phone: null,
      };

  const orderString = isRecord(value.order) && isRecord(value.order.string)
    ? {
        brand: toString(value.order.string.brand),
        model: toString(value.order.string.model),
      }
    : null;

  const order = isRecord(value.order)
    ? {
        id: toString(value.order.id),
        string: orderString,
      }
    : null;

  const pkg = isRecord(value.package)
    ? {
        id: toString(value.package.id),
        name: toString(value.package.name),
        times: toNumber(value.package.times),
        validityDays: toNumber(value.package.validityDays),
        price: toNumber(value.package.price),
      }
    : null;

  return {
    id: toString(value.id),
    amount: toNumber(value.amount),
    status: toString(value.status),
    provider: toString(value.provider),
    metadata: isRecord(value.metadata) ? value.metadata : undefined,
    createdAt: toString(value.createdAt),
    user,
    order,
    package: pkg,
  };
}

function normalizePendingPaymentList(value: unknown): PendingPayment[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizePendingPayment(item))
    .filter((item): item is PendingPayment => item !== null);
}

/**
 * 获取支付详情
 */
export async function getPayment(paymentId: string): Promise<PaymentDetail> {
  const payload = await apiRequest<unknown>(`/api/payments/${paymentId}`);
  const payment = normalizePaymentDetail(payload);
  if (!payment) {
    throw new AppError('INTERNAL_ERROR', 500, 'Invalid payment payload');
  }
  return payment;
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
    throw new AppError(
      'BAD_REQUEST',
      response.status || 400,
      data?.error?.message || data?.error || 'Failed to upload payment proof'
    );
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
): Promise<PendingPaymentsResult> {
  const cacheKey = `admin:payments:pending:${page}:${limit}`;
  return cachedRequest(
    cacheKey,
    async () => {
      const payload = await apiRequest<PendingPaymentsPayload>(`/api/admin/payments/pending?page=${page}&limit=${limit}`);

      return {
        payments: normalizePendingPaymentList(payload.payments),
        pagination: {
          page: toNumber(payload.pagination?.page, page),
          limit: toNumber(payload.pagination?.limit, limit),
          total: toNumber(payload.pagination?.total),
          totalPages: toNumber(payload.pagination?.totalPages, 1),
        },
      };
    },
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
  } catch (error: unknown) {
    return { paymentId: null, payment: null, error: getErrorMessage(error, 'Failed to create payment') };
  }
}

/**
 * 创建现金支付记录
 */
export async function createCashPayment(orderId: string, amount: number): Promise<{ payment: PaymentDetail | null; error: string | null }> {
  try {
    const payment = await apiRequest<unknown>(`/api/payments/cash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, amount }),
    });
    return { payment: normalizePaymentDetail(payment), error: null };
  } catch (error: unknown) {
    return { payment: null, error: getErrorMessage(error, '现金支付处理失败') };
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
  } catch (error: unknown) {
    return { url: null, error: getErrorMessage(error, 'Failed to upload receipt') };
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
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error, 'Failed to verify receipt') };
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
