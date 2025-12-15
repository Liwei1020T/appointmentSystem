/**
 * Payment Service - 支付服务
 */

export type PaymentMethod = 'tng' | 'fpx' | 'cash' | 'manual' | 'card';

export interface PaymentProof {
  file: File;
}

/**
 * 获取支付详情
 */
export async function getPayment(paymentId: string): Promise<any> {
  const response = await fetch(`/api/payments/${paymentId}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '获取支付信息失败');
  }

  return data.data;
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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '上传支付凭证失败');
  }

  return data.data.proofUrl;
}

/**
 * 管理员 - 获取待审核支付列表
 */
export async function getPendingPayments(
  page = 1,
  limit = 20
): Promise<any> {
  const response = await fetch(
    `/api/admin/payments/pending?page=${page}&limit=${limit}`
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '获取待审核支付失败');
  }

  return data.data;
}

/**
 * 管理员 - 确认支付
 */
export async function confirmPayment(
  paymentId: string,
  transactionId?: string,
  notes?: string
): Promise<void> {
  const response = await fetch(`/api/admin/payments/${paymentId}/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transactionId, notes }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '确认支付失败');
  }
}

/**
 * 管理员 - 拒绝支付
 */
export async function rejectPayment(
  paymentId: string,
  reason: string
): Promise<void> {
  const response = await fetch(`/api/admin/payments/${paymentId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '拒绝支付失败');
  }
}

/**
 * 获取支付状态文本
 */
export function getPaymentStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '待支付',
    pending_verification: '待审核',
    completed: '已完成',
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
    completed: 'green',
    rejected: 'red',
    cancelled: 'gray',
  };
  return colorMap[status] || 'gray';
}
