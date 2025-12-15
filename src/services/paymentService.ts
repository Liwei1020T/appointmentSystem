/**
 * Payment Service Export
 * Re-export from payment.service.ts for backward compatibility
 */

export * from './payment.service';

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

    const response = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
      return { paymentId: null, payment: null, error: data.error || 'Failed to create payment' };
    }
    const id = data.data?.id || data.paymentId || null;
    return { paymentId: id, payment: id ? { id } : null, error: null };
  } catch (error: any) {
    return { paymentId: null, payment: null, error: error.message || 'Failed to create payment' };
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
      // URL 方式 - 直接更新支付记录
      const response = await fetch(`/api/payments/${paymentId}/receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptUrl: fileOrUrl }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { url: null, error: data.error || 'Failed to update receipt' };
      }
      return { url: fileOrUrl, error: null };
    }

    // File 方式 - 上传文件
    const formData = new FormData();
    formData.append('receipt', fileOrUrl);

    const response = await fetch(`/api/payments/${paymentId}/receipt`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      return { url: null, error: data.error || 'Failed to upload receipt' };
    }
    return { url: data.data?.url || null, error: null };
  } catch (error: any) {
    return { url: null, error: error.message || 'Failed to upload receipt' };
  }
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
    const response = await fetch(`/api/admin/payments/${paymentId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved, notes }),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to verify receipt' };
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
    // Simulate payment processing
    console.log(`Simulating payment for order ${orderId}, amount: ${amount}`);
    return { success: true, transactionId: `SIM_${Date.now()}` };
  } catch (error) {
    console.error('Payment simulation failed:', error);
    return { success: false, transactionId: null };
  }
}
