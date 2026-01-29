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

export async function verifyTngPayment(
  orderId: string,
  transactionId: string
): Promise<PaymentResult> {
  try {
    const response = await fetch('/api/payments/tng/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, transactionId }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to verify TNG payment:', error);
    return {
      orderId,
      status: 'FAILED',
      amount: 0,
    };
  }
}

export async function getTngQRCode(orderId: string, amount: number): Promise<string | null> {
  try {
    const response = await fetch('/api/payments/tng/qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, amount }),
    });
    const data = await response.json();
    return data.qrCode || null;
  } catch (error) {
    console.error('Failed to get TNG QR code:', error);
    return null;
  }
}

export interface TNGCallbackData {
  orderId: string;
  transactionId: string;
  status: string;
  amount: number;
}

export async function handleTNGCallback(callbackData: TNGCallbackData): Promise<void> {
  // Stub implementation - log for debugging
  console.info('[TNG] Callback received:', callbackData);
}

/**
 * 获取TNG支付记录
 */
export async function getTNGPayment(
  paymentId: string
): Promise<{ payment: PaymentResult | null; error: string | null }> {
  try {
    const payment = await apiRequest<any>(`/api/payments/${paymentId}`);
    const orderId = payment.orderId || payment.order?.id || payment.order_id;
    const transactionId = payment.transactionId || payment.transaction_id;
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
  } catch (error: any) {
    console.error('Failed to get TNG payment:', error);
    return { payment: null, error: error.message || 'Failed to get TNG payment' };
  }
}
