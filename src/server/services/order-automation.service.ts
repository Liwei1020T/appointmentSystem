/**
 * 订单自动化服务
 * 处理订单状态自动流转和超时提醒
 */

import { prisma } from '@/lib/prisma';

// 配置参数
const ORDER_PENDING_TIMEOUT_HOURS = 48; // 待支付订单超时时间（小时）
const ORDER_INPROGRESS_WARNING_HOURS = 72; // 处理中订单预警时间（小时）
const ORDER_COMPLETION_REMINDER_HOURS = 24; // 完成后取拍提醒时间（小时）

/**
 * 判断订单是否超过指定小时阈值（基于状态变更时间）
 */
export function isOrderOverdue(order: { lastStatusChangeAt: Date }, thresholdHours: number) {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - thresholdHours);
  return order.lastStatusChangeAt < cutoff;
}

/**
 * 检查并取消超时的待支付订单
 * 返回被取消的订单数量
 */
export async function cancelTimedOutOrders(): Promise<{
  cancelledCount: number;
  cancelledOrders: string[];
}> {
  const timeoutDate = new Date();
  timeoutDate.setHours(timeoutDate.getHours() - ORDER_PENDING_TIMEOUT_HOURS);

  // 查找超时的待支付订单（没有已完成支付的订单）
  const timedOutOrders = await prisma.order.findMany({
    where: {
      status: 'pending',
      lastStatusChangeAt: { lt: timeoutDate },
      // 排除使用套餐的订单（不需要支付）
      usePackage: false,
      // 排除已有成功支付的订单
      payments: {
        none: {
          status: { in: ['success', 'completed'] },
        },
      },
    },
    select: {
      id: true,
      userId: true,
      createdAt: true,
    },
  });

  if (timedOutOrders.length === 0) {
    return { cancelledCount: 0, cancelledOrders: [] };
  }

  const cancelledOrders: string[] = [];

  for (const order of timedOutOrders) {
    try {
      await prisma.$transaction([
        // 更新订单状态为取消
        prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'cancelled',
          },
        }),
        // 创建通知
        prisma.notification.create({
          data: {
            userId: order.userId,
            type: 'order',
            title: '订单已自动取消',
            message: `您的订单因超过 ${ORDER_PENDING_TIMEOUT_HOURS} 小时未支付已被自动取消。如需继续，请重新下单。`,
            actionUrl: `/orders/${order.id}`,
          },
        }),
      ]);

      cancelledOrders.push(order.id);
    } catch (error) {
      console.error(`Failed to cancel order ${order.id}:`, error);
    }
  }

  return {
    cancelledCount: cancelledOrders.length,
    cancelledOrders,
  };
}

/**
 * 检查处理中订单是否超时并发送提醒（给管理员）
 */
export async function checkInProgressOrderWarnings(): Promise<{
  warningCount: number;
  warningOrders: string[];
}> {
  const warningDate = new Date();
  warningDate.setHours(warningDate.getHours() - ORDER_INPROGRESS_WARNING_HOURS);

  // 查找处理超时的订单
  const overdueOrders = await prisma.order.findMany({
    where: {
      status: 'in_progress',
      lastStatusChangeAt: { lt: warningDate },
    },
    select: {
      id: true,
      userId: true,
      user: { select: { fullName: true, phone: true } },
      createdAt: true,
      updatedAt: true,
    },
  });

  if (overdueOrders.length === 0) {
    return { warningCount: 0, warningOrders: [] };
  }

  // 查找管理员用户
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { id: true },
  });

  const warningOrders: string[] = [];

  // 批量检查已存在的通知（避免 N+1）
  const existingNotifications = await prisma.notification.findMany({
    where: {
      userId: { in: admins.map(a => a.id) },
      title: { contains: '订单处理超时' },
      actionUrl: { in: overdueOrders.map(o => `/admin/orders/${o.id}`) },
      createdAt: { gt: warningDate },
    },
    select: { actionUrl: true },
  });
  const notifiedOrderUrls = new Set(existingNotifications.map(n => n.actionUrl));

  for (const order of overdueOrders) {
    // 检查是否已发送过提醒（避免重复）
    const orderUrl = `/admin/orders/${order.id}`;
    if (notifiedOrderUrls.has(orderUrl)) continue;

    try {
      // 给所有管理员发送提醒
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: 'system' as const,
          title: '⚠️ 订单处理超时',
          message: `订单 ${order.id.slice(0, 8)} (${order.user?.fullName || '用户'}) 已在处理中超过 ${ORDER_INPROGRESS_WARNING_HOURS} 小时，请及时处理。`,
          actionUrl: `/admin/orders/${order.id}`,
        })),
      });

      warningOrders.push(order.id);
    } catch (error) {
      console.error(`Failed to send warning for order ${order.id}:`, error);
    }
  }

  return {
    warningCount: warningOrders.length,
    warningOrders,
  };
}

/**
 * 发送取拍提醒（订单完成后一段时间未取）
 */
export async function sendPickupReminders(): Promise<{
  reminderCount: number;
  remindedOrders: string[];
}> {
  const reminderDate = new Date();
  reminderDate.setHours(reminderDate.getHours() - ORDER_COMPLETION_REMINDER_HOURS);

  // 查找已完成但可能未取拍的订单
  const completedOrders = await prisma.order.findMany({
    where: {
      status: 'completed',
      completedAt: {
        gte: reminderDate,
        lt: new Date(reminderDate.getTime() + 60 * 60 * 1000), // 1小时窗口
      },
    },
    select: {
      id: true,
      userId: true,
      completedAt: true,
    },
  });

  if (completedOrders.length === 0) {
    return { reminderCount: 0, remindedOrders: [] };
  }

  const remindedOrders: string[] = [];

  // 批量检查已存在的提醒（避免 N+1）
  const existingReminders = await prisma.notification.findMany({
    where: {
      userId: { in: completedOrders.map(o => o.userId) },
      title: { contains: '取拍提醒' },
      actionUrl: { in: completedOrders.map(o => `/orders/${o.id}`) },
    },
    select: { actionUrl: true },
  });
  const remindedOrderUrls = new Set(existingReminders.map(n => n.actionUrl));

  for (const order of completedOrders) {
    // 检查是否已发送过取拍提醒
    const orderUrl = `/orders/${order.id}`;
    if (remindedOrderUrls.has(orderUrl)) continue;

    try {
      await prisma.notification.create({
        data: {
          userId: order.userId,
          type: 'order',
          title: '🏸 取拍提醒',
          message: '您的球拍已穿线完成，请及时到店取拍！',
          actionUrl: `/orders/${order.id}`,
        },
      });

      remindedOrders.push(order.id);
    } catch (error) {
      console.error(`Failed to send reminder for order ${order.id}:`, error);
    }
  }

  return {
    reminderCount: remindedOrders.length,
    remindedOrders,
  };
}

/**
 * 运行所有自动化任务
 * 可以通过 cron job 或 API 定期调用
 */
export async function runOrderAutomation(): Promise<{
  cancelledOrders: { count: number; ids: string[] };
  warningOrders: { count: number; ids: string[] };
  reminders: { count: number; ids: string[] };
}> {
  const [cancelled, warnings, reminders] = await Promise.all([
    cancelTimedOutOrders(),
    checkInProgressOrderWarnings(),
    sendPickupReminders(),
  ]);

  return {
    cancelledOrders: {
      count: cancelled.cancelledCount,
      ids: cancelled.cancelledOrders,
    },
    warningOrders: {
      count: warnings.warningCount,
      ids: warnings.warningOrders,
    },
    reminders: {
      count: reminders.reminderCount,
      ids: reminders.remindedOrders,
    },
  };
}

/**
 * 获取订单自动化统计信息
 */
export async function getOrderAutomationStats(): Promise<{
  pendingOrdersCount: number;
  pendingOrdersNearTimeout: number;
  inProgressOrdersCount: number;
  inProgressOrdersOverdue: number;
  completedAwaitingPickup: number;
}> {
  const now = new Date();

  // 接近超时的待支付订单（最后12小时）
  const nearTimeoutDate = new Date();
  nearTimeoutDate.setHours(nearTimeoutDate.getHours() - (ORDER_PENDING_TIMEOUT_HOURS - 12));

  // 超时的处理中订单
  const overdueDate = new Date();
  overdueDate.setHours(overdueDate.getHours() - ORDER_INPROGRESS_WARNING_HOURS);

  const [
    pendingOrdersCount,
    pendingOrdersNearTimeout,
    inProgressOrdersCount,
    inProgressOrdersOverdue,
    completedAwaitingPickup,
  ] = await Promise.all([
    prisma.order.count({ where: { status: 'pending' } }),
    prisma.order.count({
      where: {
        status: 'pending',
        lastStatusChangeAt: { lt: nearTimeoutDate },
        usePackage: false,
        payments: { none: { status: { in: ['success', 'completed'] } } },
      },
    }),
    prisma.order.count({ where: { status: 'in_progress' } }),
    prisma.order.count({
      where: { status: 'in_progress', lastStatusChangeAt: { lt: overdueDate } },
    }),
    prisma.order.count({
      where: {
        status: 'completed',
        completedAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }, // 7天内完成
      },
    }),
  ]);

  return {
    pendingOrdersCount,
    pendingOrdersNearTimeout,
    inProgressOrdersCount,
    inProgressOrdersOverdue,
    completedAwaitingPickup,
  };
}
