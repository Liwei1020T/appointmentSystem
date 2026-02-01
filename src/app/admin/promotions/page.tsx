'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Card, Button, Badge, Modal, Input, StatsCard } from '@/components';
import { apiRequest } from '@/services/apiClient';

interface Promotion {
  id: string;
  name: string;
  type: 'FLASH_SALE' | 'POINTS_BOOST' | 'SPEND_SAVE';
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: string;
  minPurchase?: string;
  startAt: string;
  endAt: string;
  isActive: boolean;
  usageCount: number;
  usageLimit?: number;
}

interface PromotionUsageSummary {
  totalSavedAmount: number;
  totalUsageCount: number;
}

interface PromotionsResponse {
  promotions: Promotion[];
  usageSummary: PromotionUsageSummary;
}

const TYPE_LABELS: Record<string, string> = {
  FLASH_SALE: '限时特惠',
  POINTS_BOOST: '积分翻倍',
  SPEND_SAVE: '满减活动',
};

export default function PromotionsPage() {
  const router = useRouter();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [usageSummary, setUsageSummary] = useState<PromotionUsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'FLASH_SALE',
    discountType: 'FIXED',
    discountValue: '',
    minPurchase: '0',
    startAt: '',
    endAt: '',
    usageLimit: '',
  });

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      const data = await apiRequest<PromotionsResponse>('/api/admin/promotions');
      setPromotions(data.promotions || []);
      setUsageSummary(data.usageSummary || null);
    } catch (err) {
      console.error('Failed to load promotions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await apiRequest('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          discountValue: Number(formData.discountValue),
          minPurchase: Number(formData.minPurchase),
          usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
          startAt: new Date(formData.startAt).toISOString(),
          endAt: new Date(formData.endAt).toISOString(),
        }),
      });

      setShowCreateModal(false);
      loadPromotions();
      setFormData({
        name: '',
        type: 'FLASH_SALE',
        discountType: 'FIXED',
        discountValue: '',
        minPurchase: '0',
        startAt: '',
        endAt: '',
        usageLimit: '',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '创建失败';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const summary = usageSummary || { totalSavedAmount: 0, totalUsageCount: 0 };
  const activeCount = promotions.filter(p => p.isActive).length;

  return (
    <div className="min-h-screen bg-ink p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/dashboard')}
            >
              ← 返回仪表板
            </Button>
            <h1 className="text-2xl font-bold text-text-primary mt-2">营销活动</h1>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>+ 创建新活动</Button>
        </div>

        {/* Stats Cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
              title="活动总数"
              value={promotions.length}
              trend={{ value: `${activeCount} 个进行中`, isPositive: true }}
            />
            <StatsCard
              title="累计使用"
              value={summary.totalUsageCount}
              trend={{ value: '次', isPositive: true }}
            />
            <StatsCard
              title="累计节省"
              value={`RM ${summary.totalSavedAmount.toFixed(2)}`}
              trend={{ value: '为用户节省', isPositive: true }}
            />
            <Card padding="md">
              <p className="text-sm text-text-tertiary">活动类型分布</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Badge variant="error">限时 {promotions.filter(p => p.type === 'FLASH_SALE').length}</Badge>
                <Badge variant="warning">积分 {promotions.filter(p => p.type === 'POINTS_BOOST').length}</Badge>
                <Badge variant="success">满减 {promotions.filter(p => p.type === 'SPEND_SAVE').length}</Badge>
              </div>
            </Card>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} padding="md" className="animate-pulse">
                <div className="h-4 skeleton-base rounded w-1/3 mb-3" />
                <div className="h-6 skeleton-base rounded w-2/3 mb-2" />
                <div className="h-8 skeleton-base rounded w-1/2 mb-4" />
                <div className="space-y-2">
                  <div className="h-3 skeleton-base rounded" />
                  <div className="h-3 skeleton-base rounded" />
                </div>
              </Card>
            ))}
          </div>
        ) : promotions.length === 0 ? (
          <Card padding="lg" className="text-center">
            <p className="text-4xl mb-3">📢</p>
            <p className="text-text-secondary">暂无营销活动</p>
            <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
              创建第一个活动
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {promotions.map((promo) => (
              <Card key={promo.id} padding="md">
                <div className="flex justify-between items-start mb-3">
                  <Badge variant={promo.isActive ? 'success' : 'neutral'}>
                    {promo.isActive ? '进行中' : '已结束'}
                  </Badge>
                  <Badge variant="info" size="sm">
                    {TYPE_LABELS[promo.type]}
                  </Badge>
                </div>

                <h3 className="text-lg font-bold text-text-primary mb-2">{promo.name}</h3>

                <div className="text-2xl font-mono font-bold text-accent mb-4">
                  {promo.discountType === 'FIXED' ? 'RM ' : ''}
                  {promo.discountValue}
                  {promo.discountType === 'PERCENTAGE' ? '%' : ''} OFF
                </div>

                <div className="space-y-2 text-sm text-text-secondary">
                  <div className="flex justify-between">
                    <span>最低消费:</span>
                    <span className="font-medium text-text-primary">RM {Number(promo.minPurchase || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>已使用:</span>
                    <span className="font-medium text-text-primary">
                      {promo.usageCount} {promo.usageLimit ? `/ ${promo.usageLimit}` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>有效期:</span>
                    <span className="font-medium text-text-primary">
                      {format(new Date(promo.startAt), 'MM/dd')} - {format(new Date(promo.endAt), 'MM/dd')}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="创建新活动"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">活动名称</label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="新年限时折扣"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">活动类型</label>
              <select
                className="w-full h-11 px-3 border border-border-subtle rounded-xl bg-white focus:ring-2 focus:ring-accent focus:border-accent"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="FLASH_SALE">限时折扣</option>
                <option value="POINTS_BOOST">积分翻倍</option>
                <option value="SPEND_SAVE">满减活动</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">折扣类型</label>
              <select
                className="w-full h-11 px-3 border border-border-subtle rounded-xl bg-white focus:ring-2 focus:ring-accent focus:border-accent"
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
              >
                <option value="FIXED">固定金额 (RM)</option>
                <option value="PERCENTAGE">百分比 (%)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">折扣数值</label>
              <Input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                placeholder="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">最低消费 (RM)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.minPurchase}
                onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">开始时间</label>
              <Input
                type="datetime-local"
                required
                value={formData.startAt}
                onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">结束时间</label>
              <Input
                type="datetime-local"
                required
                value={formData.endAt}
                onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">使用限制 (可选)</label>
            <Input
              type="number"
              min="1"
              value={formData.usageLimit}
              onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
              placeholder="留空则无限制"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setShowCreateModal(false)}
            >
              取消
            </Button>
            <Button type="submit" fullWidth loading={submitting}>
              创建活动
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
