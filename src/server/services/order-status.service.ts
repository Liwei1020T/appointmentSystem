/**
 * Order status helpers for display and validation.
 */

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'received',
  'in_progress',
  'ready',
  'completed',
  'picked_up',
  'cancelled',
  'payment_rejected',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

const STATUS_LABELS: Record<string, string> = {
  pending: '待处理',
  confirmed: '已确认',
  processing: '处理中',
  received: '已收拍',
  in_progress: '穿线中',
  ready: '待取拍',
  completed: '已完成',
  picked_up: '已取拍',
  cancelled: '已取消',
  payment_rejected: '付款被拒',
};

/**
 * Formats an order status into a user-facing label.
 * @param status Order status code
 * @returns Localized label for display
 */
export function formatStatusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}

/**
 * Validates an order status value.
 * @param status Order status code
 * @returns True when status is allowed
 */
export function validateOrderStatus(status: string) {
  return ORDER_STATUSES.includes(status as OrderStatus);
}
