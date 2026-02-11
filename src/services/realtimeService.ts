/**
 * Realtime Service
 * 基于 Polling 的实时订单更新服务
 *
 * 使用轮询机制定期获取订单更新，无需 WebSocket 基础设施
 */

const POLL_INTERVAL = 10000; // 10秒轮询一次

export interface RealtimeSubscription {
  unsubscribe: () => void;
}

export interface OrderUpdateData {
  orderId: string;
  status: string;
  updatedAt: string;
  // 可扩展其他字段
}

function toOrderUpdateData(raw: unknown): OrderUpdateData | null {
  if (!raw || typeof raw !== 'object') return null;

  const candidate = raw as Record<string, unknown>;
  const orderIdValue = candidate.orderId ?? candidate.id;
  const statusValue = candidate.status;
  const updatedAtValue = candidate.updatedAt ?? candidate.updated_at;

  if (typeof orderIdValue !== 'string' || typeof statusValue !== 'string') {
    return null;
  }

  if (typeof updatedAtValue !== 'string') {
    return {
      orderId: orderIdValue,
      status: statusValue,
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    orderId: orderIdValue,
    status: statusValue,
    updatedAt: updatedAtValue,
  };
}

/**
 * 从 orders API 响应中提取简化后的订单更新列表。
 * 兼容两种历史结构：
 * 1) { ok: true, data: Order[] }
 * 2) { ok: true, data: { orders: Order[] } }
 */
export function extractOrderUpdatesFromPayload(payload: unknown): OrderUpdateData[] {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const candidate = payload as Record<string, unknown>;
  const data = candidate.data;

  if (Array.isArray(data)) {
    return data
      .map(toOrderUpdateData)
      .filter((order): order is OrderUpdateData => Boolean(order));
  }

  if (!data || typeof data !== 'object') {
    return [];
  }

  const maybeOrders = (data as Record<string, unknown>).orders;
  if (!Array.isArray(maybeOrders)) {
    return [];
  }

  return maybeOrders
    .map(toOrderUpdateData)
    .filter((order): order is OrderUpdateData => Boolean(order));
}

/**
 * 订阅单个订单更新
 * @param orderId 订单 ID
 * @param callback 更新回调
 * @returns 订阅对象，调用 unsubscribe 停止轮询
 */
export function subscribeToOrderUpdates(
  orderId: string,
  callback: (data: OrderUpdateData) => void
): RealtimeSubscription {
  let isActive = true;
  let lastStatus: string | null = null;
  let lastUpdatedAt: string | null = null;

  const poll = async () => {
    if (!isActive) return;

    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok || !isActive) {
        // 订单可能已删除或无权限访问，或已取消订阅
        return;
      }

      const result = await response.json();
      const order = result.data;

      if (!order || !isActive) return;

      // 检查是否有更新
      const hasUpdate =
        lastStatus !== order.status ||
        lastUpdatedAt !== order.updatedAt;

      if (hasUpdate && lastStatus !== null && isActive) {
        // 触发回调（首次不触发，避免重复加载）
        callback({
          orderId: order.id,
          status: order.status,
          updatedAt: order.updatedAt,
        });
      }

      lastStatus = order.status;
      lastUpdatedAt = order.updatedAt;
    } catch (error) {
      console.error('[RealtimeService] Poll error:', error);
    }

    // 继续轮询
    if (isActive) {
      setTimeout(poll, POLL_INTERVAL);
    }
  };

  // 开始轮询
  poll();

  return {
    unsubscribe: () => {
      isActive = false;
    },
  };
}

/**
 * 订阅用户所有订单更新
 * @param userId 用户 ID（实际上不需要传，API 自动使用当前登录用户）
 * @param callback 更新回调
 * @returns 订阅对象
 */
export function subscribeToUserOrders(
  _userId: string,
  callback: (data: { orders: OrderUpdateData[] }) => void
): RealtimeSubscription {
  let isActive = true;
  let lastOrdersHash: string | null = null;

  const poll = async () => {
    if (!isActive) return;

    try {
      const response = await fetch('/api/orders?limit=10');
      if (!response.ok || !isActive) {
        return;
      }

      const result = await response.json();
      const orders = extractOrderUpdatesFromPayload(result);

      if (!isActive) return;

      // 生成简单的状态哈希来检测变化
      const ordersHash = orders
        .map((o) => `${o.orderId}:${o.status}:${o.updatedAt}`)
        .join('|');

      if (ordersHash !== lastOrdersHash && lastOrdersHash !== null && isActive) {
        // 有更新，触发回调
        callback({ orders });
      }

      lastOrdersHash = ordersHash;
    } catch (error) {
      console.error('[RealtimeService] Poll error:', error);
    }

    // 继续轮询
    if (isActive) {
      setTimeout(poll, POLL_INTERVAL);
    }
  };

  // 开始轮询
  poll();

  return {
    unsubscribe: () => {
      isActive = false;
    },
  };
}
