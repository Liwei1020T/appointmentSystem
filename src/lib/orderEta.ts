import type { OrderWithDetails } from '@/services/orderService';

type WorkQueueEstimate = {
  etaLabel?: string;
  minDays?: number;
  maxDays?: number;
  queuePosition?: number;
  status?: string;
};

export type OrderEtaResult = {
  label: string;
  tone: 'success' | 'warning' | 'info' | 'neutral';
  detail?: string;
};

type OrderWithQueue = OrderWithDetails & {
  workQueueEstimate?: WorkQueueEstimate;
  queueEstimate?: WorkQueueEstimate;
  workQueue?: WorkQueueEstimate;
};

const formatEtaRange = (min?: number, max?: number) => {
  if (min && max && min !== max) {
    return `${min}-${max} 天`;
  }
  if (min) {
    return `${min} 天`; 
  }
  if (max) {
    return `${max} 天`;
  }
  return '1-3 天';
};

export function getWorkQueueEstimate(order: OrderWithDetails): WorkQueueEstimate | null {
  const candidate = order as OrderWithQueue;
  return (
    candidate.workQueueEstimate ||
    candidate.queueEstimate ||
    candidate.workQueue ||
    null
  );
}

export function getOrderEtaEstimate(order: OrderWithDetails): OrderEtaResult {
  const queue = getWorkQueueEstimate(order);
  if (queue?.etaLabel) {
    return {
      label: queue.etaLabel,
      tone: 'info',
      detail: queue.status,
    };
  }

  if (queue?.minDays || queue?.maxDays) {
    const label = `预计完成 ${formatEtaRange(queue.minDays, queue.maxDays)}`;
    return {
      label,
      tone: 'info',
      detail: queue.status,
    };
  }

  if (order.status === 'pending') {
    const label = queue?.queuePosition
      ? `已接单 · 排队 ${queue.queuePosition}`
      : '已接单';
    return {
      label,
      tone: 'neutral',
      detail: queue?.status,
    };
  }

  if (order.status === 'in_progress') {
    return {
      label: '预计完成 1-3 天',
      tone: 'info',
      detail: '正在穿线中',
    };
  }

  if (order.status === 'completed') {
    return {
      label: '已完成',
      tone: 'success',
    };
  }

  return {
    label: '处理中',
    tone: 'neutral',
  };
}
