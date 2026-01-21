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
