/**
 * TNG Payment Service
 * Touch 'n Go 支付功能
 */

import { apiRequest } from '@/services/apiClient';

export interface PaymentResult {
  orderId: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  amount: number;
  transactionId?: string;
  order_id?: string;
  transaction_id?: string;
}

export interface TNGCallbackData {
  orderId: string;
  transactionId: string;
  status: string;
  amount: number;
}

/**
 * 处理 TNG 支付回调（供 webhook 使用）
 */
export async function handleTNGCallback(callbackData: TNGCallbackData): Promise<void> {
  // 目前是手动支付流程，此函数为未来自动回调预留
  console.info('[TNG] Callback received:', callbackData);
}

export interface PaymentApiResponse {
  orderId?: string;
  order_id?: string;
  transactionId?: string;
  transaction_id?: string;
  amount?: number;
  status?: string;
  payment_status?: string;
  order?: {
    id?: string;
    price?: number;
  };
}

/**
 * 获取TNG支付记录
 */
export async function getTNGPayment(
  paymentId: string
): Promise<{ payment: PaymentResult | null; error: string | null }> {
  try {
    const payment = await apiRequest<PaymentApiResponse>(`/api/payments/${paymentId}`);
    const orderId = payment.orderId || payment.order?.id || payment.order_id || '';
    const transactionId = payment.transactionId || payment.transaction_id || '';
    const amount = Number(payment.amount ?? payment.order?.price ?? 0) || 0;
    const statusRaw = payment.status || payment.payment_status || 'pending';
    const status = String(statusRaw).toUpperCase() as PaymentResult['status'];

    return {
      payment: {
        orderId,
        order_id: orderId,
        status,
        amount,
        transactionId,
        transaction_id: transactionId,
      },
      error: null,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get TNG payment';
    console.error('Failed to get TNG payment:', error);
    return { payment: null, error: message };
  }
}
