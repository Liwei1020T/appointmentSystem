export type ServiceType = 'in_store' | 'pickup_delivery';
export type TimelineStatus = 'pending' | 'received' | 'in_progress' | 'completed' | 'picked_up' | 'cancelled';
export type ProgressStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface OrderPaymentLike {
  id?: string;
  status?: string;
  payment_status?: string;
  provider?: string;
  payment_method?: string;
  method?: string;
  amount?: number | string;
  createdAt?: string | Date | null;
  created_at?: string | Date | null;
  updatedAt?: string | Date | null;
  updated_at?: string | Date | null;
  paid_at?: string | Date | null;
  receipt_url?: string;
  metadata?: Record<string, unknown> | null;
}

export interface OrderStatusLogLike {
  status?: string;
  createdAt?: string | Date | null;
  created_at?: string | Date | null;
  note?: string | null;
  notes?: string | null;
}

export interface OrderPaymentContainerLike {
  payment?: OrderPaymentLike | null;
  payments?: OrderPaymentLike[] | null;
}

export interface ServiceTypeContainerLike {
  serviceType?: string | null;
  service_type?: string | null;
}

export interface PickupAddressContainerLike {
  pickupAddress?: string | null;
  pickup_address?: string | null;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function getStringDate(value: string | Date | null | undefined): string | undefined {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : String(value);
}

export function getDateRankForPayment(payment: OrderPaymentLike): number {
  const raw = payment.updatedAt ?? payment.updated_at ?? payment.createdAt ?? payment.created_at;
  if (!raw) return 0;
  const timestamp = new Date(raw).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function pickRelevantPayment(order: OrderPaymentContainerLike | null | undefined): OrderPaymentLike | null {
  if (!order) return null;
  if (order.payment) return order.payment;

  const payments = Array.isArray(order.payments) ? order.payments : [];
  if (payments.length === 0) return null;

  const ranked = payments
    .filter((payment) => payment && String(payment.status ?? '').toLowerCase() !== 'failed')
    .sort((a, b) => getDateRankForPayment(b) - getDateRankForPayment(a));

  return ranked[0] ?? payments[0] ?? null;
}

export function normalizeStatusLogs(logs: OrderStatusLogLike[] | null | undefined) {
  if (!Array.isArray(logs) || logs.length === 0) return undefined;

  const normalized = logs
    .map((log) => {
      const status = String(log.status ?? '').trim();
      const createdAt = getStringDate(log.createdAt ?? log.created_at);
      if (!status || !createdAt) return null;

      return {
        status,
        createdAt,
        note: log.note ?? log.notes ?? null,
      };
    })
    .filter((log): log is { status: string; createdAt: string; note: string | null } => Boolean(log));

  return normalized.length > 0 ? normalized : undefined;
}

export function resolveServiceType(order: ServiceTypeContainerLike | null | undefined): ServiceType {
  const raw = String(order?.serviceType ?? order?.service_type ?? 'in_store');
  return raw === 'pickup_delivery' ? 'pickup_delivery' : 'in_store';
}

export function resolvePickupAddress(order: PickupAddressContainerLike | null | undefined): string | undefined {
  const value = order?.pickupAddress ?? order?.pickup_address ?? undefined;
  if (!value) return undefined;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : undefined;
}

export function mapAdminStatusToProgressStatus(status: string): ProgressStatus {
  if (status === 'cancelled') return 'cancelled';
  if (status === 'completed' || status === 'ready') return 'completed';
  if (status === 'pending') return 'pending';
  return 'in_progress';
}

export function mapStatusToTimelineStatus(status: string | null | undefined): TimelineStatus {
  const raw = String(status ?? '').toLowerCase();
  if (raw === 'received') return 'received';
  if (raw === 'in_progress') return 'in_progress';
  if (raw === 'completed') return 'completed';
  if (raw === 'picked_up') return 'picked_up';
  if (raw === 'cancelled') return 'cancelled';
  return 'pending';
}
