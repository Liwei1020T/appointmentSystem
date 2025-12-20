/**
 * TNG Payment Service
 * Touch 'n Go 支付功能
 */

export interface PaymentResult {
  orderId: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  amount: number;
  transactionId?: string;
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
  // Stub implementation
  console.log('TNG callback received:', callbackData);
}

/**
 * 获取TNG支付记录
 */
export async function getTNGPayment(
  paymentId: string
): Promise<{ payment: PaymentResult | null; error: string | null }> {
  try {
    const response = await fetch(`/api/payments/tng/${paymentId}`);
    const data = await response.json();
    if (!response.ok) {
      return { payment: null, error: data.error || 'Failed to get TNG payment' };
    }
    return { payment: data.payment || null, error: null };
  } catch (error: any) {
    console.error('Failed to get TNG payment:', error);
    return { payment: null, error: error.message || 'Failed to get TNG payment' };
  }
}
