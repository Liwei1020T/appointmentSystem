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
  // 1. 优先使用管理员手动设置的 ETA
  const etaDateStr = (order as any).estimatedCompletionAt || (order as any).estimated_completion_at;

  if (etaDateStr && (order.status === 'pending' || order.status === 'in_progress')) {
    const eta = new Date(etaDateStr);
    const now = new Date();
    const diffMs = eta.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    let label = '';
    if (diffDays <= 0) label = '预计今日完成';
    else if (diffDays === 1) label = '预计明天完成';
    else if (diffDays <= 7) label = `预计 ${diffDays} 天后完成`;
    else {
      const month = eta.getMonth() + 1;
      const day = eta.getDate();
      label = `预计 ${month}月${day}日 完成`;
    }

    return {
      label,
      tone: 'info',
      detail: '管理员已确认'
    };
  }

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
