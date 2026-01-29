import { describe, it, expect } from 'vitest';
import { getOrderEtaEstimate } from '@/lib/orderEta';
import type { OrderWithDetails } from '@/services/orderService';

type QueueEstimate = {
  etaLabel?: string;
  status?: string;
  minDays?: number;
  maxDays?: number;
  queuePosition?: number;
};

type OrderWithQueue = OrderWithDetails & {
  workQueueEstimate?: QueueEstimate;
  queueEstimate?: QueueEstimate;
  workQueue?: QueueEstimate;
};

// 创建模拟订单数据的工厂函数
function createMockOrder(overrides: Partial<OrderWithQueue> = {}): OrderWithQueue {
  const base: OrderWithQueue = {
    id: 'test-order-id',
    userId: 'test-user-id',
    stringId: 'test-string-id',
    tension: 24,
    price: 100,
    costPrice: 50,
    discountAmount: 0,
    finalPrice: 100,
    status: 'pending',
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
    estimatedCompletionAt: null,
    serviceType: 'in_store',
    pickupAddress: null,
    ratingScore: null,
    ratingComment: null,
    ratedAt: null,
  };

  return { ...base, ...overrides };
}

describe('getOrderEtaEstimate', () => {
  describe('基本状态处理', () => {
    it('pending 状态返回 neutral tone', () => {
      const order = createMockOrder({ status: 'pending' });
      const result = getOrderEtaEstimate(order);

      expect(result.tone).toBe('neutral');
      expect(result.label).toContain('已接单');
    });

    it('in_progress 状态返回 info tone 和 ETA 估算', () => {
      const order = createMockOrder({ status: 'in_progress' });
      const result = getOrderEtaEstimate(order);

      expect(result.tone).toBe('info');
      expect(result.label).toContain('预计完成');
      expect(result.detail).toBe('正在穿线中');
    });

    it('completed 状态返回 success tone', () => {
      const order = createMockOrder({ status: 'completed' });
      const result = getOrderEtaEstimate(order);

      expect(result.tone).toBe('success');
      expect(result.label).toBe('已完成');
    });

    it('未知状态返回 neutral tone', () => {
      const order = createMockOrder({ status: 'unknown' as OrderWithDetails['status'] });
      const result = getOrderEtaEstimate(order);

      expect(result.tone).toBe('neutral');
      expect(result.label).toBe('处理中');
    });
  });

  describe('队列数据处理', () => {
    it('有 etaLabel 时使用该标签', () => {
      const order = createMockOrder({
        status: 'pending',
      });
      // 添加队列估算数据
      order.workQueueEstimate = {
        etaLabel: '明天完成',
        status: '已接单',
      };

      const result = getOrderEtaEstimate(order);

      expect(result.label).toBe('明天完成');
      expect(result.tone).toBe('info');
      expect(result.detail).toBe('已接单');
    });

    it('有 minDays/maxDays 时格式化范围', () => {
      const order = createMockOrder({ status: 'pending' });
      order.workQueueEstimate = {
        minDays: 2,
        maxDays: 4,
      };

      const result = getOrderEtaEstimate(order);

      expect(result.label).toContain('2-4 天');
      expect(result.tone).toBe('info');
    });

    it('minDays 和 maxDays 相同时只显示单个数字', () => {
      const order = createMockOrder({ status: 'pending' });
      order.workQueueEstimate = {
        minDays: 3,
        maxDays: 3,
      };

      const result = getOrderEtaEstimate(order);

      expect(result.label).toContain('3 天');
      expect(result.label).not.toContain('3-3');
    });

    it('有 queuePosition 时显示排队位置', () => {
      const order = createMockOrder({ status: 'pending' });
      order.workQueueEstimate = {
        queuePosition: 5,
      };

      const result = getOrderEtaEstimate(order);

      expect(result.label).toContain('排队 5');
    });
  });

  describe('边界情况', () => {
    it('空订单项也能正常处理', () => {
      const order = createMockOrder({ status: 'pending' });
      const result = getOrderEtaEstimate(order);

      expect(result).toHaveProperty('label');
      expect(result).toHaveProperty('tone');
    });

    it('支持 queueEstimate 别名', () => {
      const order = createMockOrder({ status: 'pending' });
      order.queueEstimate = {
        etaLabel: '测试标签',
      };

      const result = getOrderEtaEstimate(order);

      expect(result.label).toBe('测试标签');
    });

    it('支持 workQueue 别名', () => {
      const order = createMockOrder({ status: 'pending' });
      order.workQueue = {
        etaLabel: '工作队列标签',
      };

      const result = getOrderEtaEstimate(order);

      expect(result.label).toBe('工作队列标签');
    });
  });
});
