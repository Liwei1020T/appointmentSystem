/**
 * Refund Service
 * 退款管理功能
 */

export type RefundStatus = 'pending' | 'approved' | 'processing' | 'completed' | 'rejected' | 'failed' | string;

export interface RefundRequest {
  id: string;
  orderId: string;
  order_id?: string;
  userId: string;
  user_id?: string;
  amount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'pending' | 'approved' | 'rejected' | string;
  createdAt?: Date;
  created_at?: Date;
  processedAt?: Date;
  processed_at?: Date;
  notes?: string;
  refund_type?: 'full' | 'partial' | string;
  refundType?: 'full' | 'partial' | string;
  admin_notes?: string;
  adminNotes?: string;
  refund_amount?: number;
  refundAmount?: number;
  original_amount?: number;
  originalAmount?: number;
  failed_reason?: string;
  failedReason?: string;
  approved_at?: Date;
  approvedAt?: Date;
  completed_at?: Date;
  completedAt?: Date;
  transaction_id?: string;
  transactionId?: string;
}

// Type alias for Refund
export type Refund = RefundRequest;
export type RefundType = 'full' | 'partial' | string;

export async function createRefundRequest(
  orderId: string,
  reason: string
): Promise<RefundRequest | null> {
  try {
    const response = await fetch('/api/refunds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, reason }),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Failed to create refund request:', error);
    return null;
  }
}

export async function processRefund(
  refundId: string,
  status?: 'APPROVED' | 'REJECTED' | string,
  notes?: string
): Promise<{ success: boolean; error?: string } & boolean> {
  try {
    const response = await fetch(`/api/admin/refunds/${refundId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: status || 'APPROVED', notes }),
    });
    const result = { success: response.ok, error: response.ok ? undefined : 'Failed to process refund' };
    // Return as both object and boolean for backward compatibility
    return Object.assign(response.ok, result);
  } catch (error) {
    console.error('Failed to process refund:', error);
    const result = { success: false, error: 'Failed to process refund' };
    return Object.assign(false, result);
  }
}

export async function getRefundsByOrder(orderId: string): Promise<RefundRequest[]> {
  try {
    const response = await fetch(`/api/orders/${orderId}/refunds`);
    const data = await response.json();
    return data.refunds || [];
  } catch (error) {
    console.error('Failed to fetch refunds:', error);
    return [];
  }
}

export async function getRefundsByOrderId(orderId: string): Promise<{ refunds: RefundRequest[]; data: RefundRequest[]; error: string | null }> {
  try {
    const refunds = await getRefundsByOrder(orderId);
    return { refunds, data: refunds, error: null };
  } catch (error) {
    console.error('Failed to fetch refunds by order ID:', error);
    return { refunds: [], data: [], error: 'Failed to fetch refunds' };
  }
}

export async function approveRefund(refundId: string, notes?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await processRefund(refundId, 'APPROVED', notes);
    return { success: result, error: result ? undefined : 'Failed to approve refund' };
  } catch (error) {
    console.error('Failed to approve refund:', error);
    return { success: false, error: 'Failed to approve refund' };
  }
}

export async function rejectRefund(refundId: string, notes?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await processRefund(refundId, 'REJECTED', notes);
    return { success: result, error: result ? undefined : 'Failed to reject refund' };
  } catch (error) {
    console.error('Failed to reject refund:', error);
    return { success: false, error: 'Failed to reject refund' };
  }
}

export interface CreateRefundParams {
  orderId?: string;
  order_id?: string;
  payment_id?: string;
  paymentId?: string;
  refund_type?: RefundType;
  refundType?: RefundType;
  refund_amount?: number;
  refundAmount?: number;
  amount?: number;
  reason?: string;
  admin_notes?: string;
  adminNotes?: string;
}

export async function createRefund(
  orderIdOrParams: string | CreateRefundParams,
  amount?: number,
  reason?: string
): Promise<{ success: boolean; refund?: RefundRequest; error?: string }> {
  try {
    let body: Record<string, unknown>;
    
    if (typeof orderIdOrParams === 'object') {
      // Object parameter format
      body = {
        orderId: orderIdOrParams.orderId || orderIdOrParams.order_id,
        paymentId: orderIdOrParams.payment_id || orderIdOrParams.paymentId,
        refundType: orderIdOrParams.refund_type || orderIdOrParams.refundType,
        amount: orderIdOrParams.refund_amount || orderIdOrParams.refundAmount || orderIdOrParams.amount,
        reason: orderIdOrParams.reason,
        adminNotes: orderIdOrParams.admin_notes || orderIdOrParams.adminNotes,
      };
    } else {
      // Legacy format
      body = { orderId: orderIdOrParams, amount, reason };
    }
    
    const response = await fetch('/api/refunds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.error || 'Failed to create refund' };
    }
    const refund = await response.json();
    return { success: true, refund };
  } catch (error) {
    console.error('Failed to create refund:', error);
    return { success: false, error: 'Failed to create refund' };
  }
}
