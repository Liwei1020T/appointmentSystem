/**
 * 订单 ETA 计算服务
 * 根据当前队列情况计算预计完成时间
 */

import { prisma } from '@/lib/prisma';

// 配置参数
const DEFAULT_PROCESSING_DAYS = 2; // 默认处理时间（天）
const MAX_QUEUE_DAYS = 7;          // 最大队列延迟（天）
const ORDERS_PER_DAY = 5;          // 每天可处理订单数

/**
 * 标准化的 ETA 队列元数据结构
 */
export interface EtaQueueMeta {
  queuePosition: number | null;
  queueStartAt: string | null;
  estimatedDays: number;
  updatedAt: string;
  etaLabel: string;
  minDays: number;
  maxDays: number;
}

/**
 * 计算订单预计完成时间
 * 基于当前未完成订单数量估算
 *
 * @returns 预计完成日期
 */
export async function calculateEstimatedCompletion(): Promise<Date> {
  // 获取当前未完成订单数量
  const pendingOrdersCount = await prisma.order.count({
    where: {
      status: { in: ['pending', 'in_progress'] },
    },
  });

  // 计算队列延迟天数
  const queueDays = Math.min(
    Math.ceil(pendingOrdersCount / ORDERS_PER_DAY),
    MAX_QUEUE_DAYS
  );

  // 总预计天数 = 队列天数 + 处理天数
  const totalDays = queueDays + DEFAULT_PROCESSING_DAYS;

  // 计算预计完成日期
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + totalDays);

  // 跳过周日（如果落在周日，顺延到周一）
  if (estimatedDate.getDay() === 0) {
    estimatedDate.setDate(estimatedDate.getDate() + 1);
  }

  return estimatedDate;
}

/**
 * 获取订单在队列中的位置
 *
 * @param orderId - 订单 ID
 * @returns 队列位置（1-based）或 null（如果订单已完成）
 */
export async function getOrderQueuePosition(orderId: string): Promise<number | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, createdAt: true },
  });

  if (!order || order.status === 'completed' || order.status === 'cancelled') {
    return null;
  }

  // 计算在此订单之前创建的未完成订单数
  const position = await prisma.order.count({
    where: {
      status: { in: ['pending', 'in_progress'] },
      createdAt: { lt: order.createdAt },
    },
  });

  return position + 1;
}

/**
 * 格式化预计完成时间显示
 *
 * @param estimatedDate - 预计完成日期
 * @returns 友好的时间显示字符串
 */
export function formatEstimatedCompletion(estimatedDate: Date | null): string {
  if (!estimatedDate) {
    return '处理中';
  }

  const now = new Date();
  const diffMs = estimatedDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return '今日完成';
  }

  if (diffDays === 1) {
    return '明天完成';
  }

  if (diffDays <= 7) {
    return `${diffDays} 天后完成`;
  }

  // 超过一周，显示具体日期
  const month = estimatedDate.getMonth() + 1;
  const day = estimatedDate.getDate();
  return `${month}月${day}日完成`;
}

/**
 * 获取订单 ETA 信息（用于 API 返回）
 */
export async function getOrderEtaInfo(orderId: string): Promise<{
  estimatedCompletionAt: string | null;
  estimatedCompletionLabel: string;
  queuePosition: number | null;
}> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { estimatedCompletionAt: true, status: true },
  });

  if (!order) {
    return {
      estimatedCompletionAt: null,
      estimatedCompletionLabel: '未知',
      queuePosition: null,
    };
  }

  if (order.status === 'completed') {
    return {
      estimatedCompletionAt: null,
      estimatedCompletionLabel: '已完成',
      queuePosition: null,
    };
  }

  if (order.status === 'cancelled') {
    return {
      estimatedCompletionAt: null,
      estimatedCompletionLabel: '已取消',
      queuePosition: null,
    };
  }

  const queuePosition = await getOrderQueuePosition(orderId);

  return {
    estimatedCompletionAt: order.estimatedCompletionAt?.toISOString() || null,
    estimatedCompletionLabel: formatEstimatedCompletion(order.estimatedCompletionAt),
    queuePosition,
  };
}

/**
 * 获取订单完整的 ETA 队列元数据（标准化格式）
 * 用于 API 返回，确保前端显示一致性
 */
export async function getOrderEtaQueueMeta(
  order: {
    id: string;
    status: string;
    createdAt: Date;
    estimatedCompletionAt: Date | null;
  }
): Promise<EtaQueueMeta> {
  const now = new Date();
  const updatedAt = now.toISOString();

  // 已完成/已取消订单
  if (order.status === 'completed') {
    return {
      queuePosition: null,
      queueStartAt: null,
      estimatedDays: 0,
      updatedAt,
      etaLabel: '已完成',
      minDays: 0,
      maxDays: 0,
    };
  }

  if (order.status === 'cancelled') {
    return {
      queuePosition: null,
      queueStartAt: null,
      estimatedDays: 0,
      updatedAt,
      etaLabel: '已取消',
      minDays: 0,
      maxDays: 0,
    };
  }

  // 获取队列位置
  const queuePosition = await getOrderQueuePosition(order.id);
  const queueStartAt = order.createdAt.toISOString();

  // 计算预估天数
  let estimatedDays = DEFAULT_PROCESSING_DAYS;
  let minDays = 1;
  let maxDays = 3;
  let etaLabel = '预计完成 1-3 天';

  if (order.estimatedCompletionAt) {
    const diffMs = order.estimatedCompletionAt.getTime() - now.getTime();
    estimatedDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    if (estimatedDays === 0) {
      etaLabel = '今日完成';
      minDays = 0;
      maxDays = 0;
    } else if (estimatedDays === 1) {
      etaLabel = '明天完成';
      minDays = 1;
      maxDays = 1;
    } else if (estimatedDays <= 3) {
      etaLabel = `预计完成 ${estimatedDays} 天`;
      minDays = estimatedDays;
      maxDays = estimatedDays;
    } else {
      etaLabel = formatEstimatedCompletion(order.estimatedCompletionAt);
      minDays = estimatedDays;
      maxDays = estimatedDays + 1;
    }
  } else if (order.status === 'in_progress') {
    etaLabel = '预计完成 1-3 天';
    minDays = 1;
    maxDays = 3;
  } else if (queuePosition) {
    etaLabel = queuePosition > 5
      ? `排队 ${queuePosition}，预计 3-5 天`
      : `排队 ${queuePosition}，预计 1-3 天`;
    if (queuePosition > 5) {
      minDays = 3;
      maxDays = 5;
    }
  }

  return {
    queuePosition,
    queueStartAt,
    estimatedDays,
    updatedAt,
    etaLabel,
    minDays,
    maxDays,
  };
}

/**
 * 批量获取订单的 ETA 队列元数据
 * 优化性能，减少数据库查询次数
 */
export async function batchGetOrderEtaQueueMeta(
  orders: Array<{
    id: string;
    status: string;
    createdAt: Date;
    estimatedCompletionAt: Date | null;
  }>
): Promise<Map<string, EtaQueueMeta>> {
  const result = new Map<string, EtaQueueMeta>();

  // 获取所有未完成订单的 ID
  const pendingOrderIds = orders
    .filter(o => o.status === 'pending' || o.status === 'in_progress')
    .map(o => o.id);

  // 批量获取队列位置
  const queuePositions = new Map<string, number>();
  if (pendingOrderIds.length > 0) {
    // 获取这些订单之前的未完成订单数量
    for (const orderId of pendingOrderIds) {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        const position = await prisma.order.count({
          where: {
            status: { in: ['pending', 'in_progress'] },
            createdAt: { lt: order.createdAt },
          },
        });
        queuePositions.set(orderId, position + 1);
      }
    }
  }

  const now = new Date();
  const updatedAt = now.toISOString();

  for (const order of orders) {
    if (order.status === 'completed') {
      result.set(order.id, {
        queuePosition: null,
        queueStartAt: null,
        estimatedDays: 0,
        updatedAt,
        etaLabel: '已完成',
        minDays: 0,
        maxDays: 0,
      });
      continue;
    }

    if (order.status === 'cancelled') {
      result.set(order.id, {
        queuePosition: null,
        queueStartAt: null,
        estimatedDays: 0,
        updatedAt,
        etaLabel: '已取消',
        minDays: 0,
        maxDays: 0,
      });
      continue;
    }

    const queuePosition = queuePositions.get(order.id) || null;
    const queueStartAt = order.createdAt.toISOString();

    let estimatedDays = DEFAULT_PROCESSING_DAYS;
    let minDays = 1;
    let maxDays = 3;
    let etaLabel = '预计完成 1-3 天';

    if (order.estimatedCompletionAt) {
      const diffMs = order.estimatedCompletionAt.getTime() - now.getTime();
      estimatedDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      if (estimatedDays === 0) {
        etaLabel = '今日完成';
        minDays = 0;
        maxDays = 0;
      } else if (estimatedDays === 1) {
        etaLabel = '明天完成';
        minDays = 1;
        maxDays = 1;
      } else if (estimatedDays <= 3) {
        etaLabel = `预计完成 ${estimatedDays} 天`;
        minDays = estimatedDays;
        maxDays = estimatedDays;
      } else {
        etaLabel = formatEstimatedCompletion(order.estimatedCompletionAt);
        minDays = estimatedDays;
        maxDays = estimatedDays + 1;
      }
    } else if (order.status === 'in_progress') {
      etaLabel = '预计完成 1-3 天';
    } else if (queuePosition) {
      etaLabel = queuePosition > 5
        ? `排队 ${queuePosition}，预计 3-5 天`
        : `排队 ${queuePosition}，预计 1-3 天`;
      if (queuePosition > 5) {
        minDays = 3;
        maxDays = 5;
      }
    }

    result.set(order.id, {
      queuePosition,
      queueStartAt,
      estimatedDays,
      updatedAt,
      etaLabel,
      minDays,
      maxDays,
    });
  }

  return result;
}
