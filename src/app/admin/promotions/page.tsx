'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Card, Button, Badge, Toast, Modal } from '@/components';
import PageHeader from '@/components/layout/PageHeader';
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

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [usageSummary, setUsageSummary] = useState<PromotionUsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Form State
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
    } catch (error) {
      console.error('Failed to load promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          discountValue: Number(formData.discountValue),
          minPurchase: Number(formData.minPurchase),
          usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
          // Convert local datetime-local string to ISO string for backend
          startAt: new Date(formData.startAt).toISOString(),
          endAt: new Date(formData.endAt).toISOString(),
        }),
      });

      setToast({ show: true, message: '活动创建成功', type: 'success' });
      setShowCreateModal(false);
      loadPromotions();
      // Reset form
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
    } catch (error: any) {
      setToast({ show: true, message: error.message || '创建失败', type: 'error' });
    }
  };

  const summary = usageSummary || { totalSavedAmount: 0, totalUsageCount: 0 };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <PageHeader title="营销活动管理" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900">活动列表</h2>
          <Button onClick={() => setShowCreateModal(true)}>
            创建新活动
          </Button>
        </div>

        {!loading && (
          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            <Card className="p-4">
              <p className="text-xs text-gray-500">累计使用次数</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.totalUsageCount}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-gray-500">累计为用户节省</p>
              <p className="text-2xl font-semibold text-accent font-mono">
                RM {summary.totalSavedAmount.toFixed(2)}
              </p>
            </Card>
          </div>
        )}

        {loading ? (
          <div className="text-center py-10">加载中...</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {promotions.map((promo) => (
              <Card key={promo.id} className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={promo.isActive ? 'success' : 'neutral'}>
                    {promo.isActive ? '进行中' : '已结束'}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {promo.type === 'FLASH_SALE' ? '限时特惠' :
                     promo.type === 'POINTS_BOOST' ? '积分翻倍' : '满减活动'}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1">{promo.name}</h3>

                <div className="text-2xl font-mono font-bold text-accent mb-4">
                  {promo.discountType === 'FIXED' ? 'RM ' : ''}
                  {promo.discountValue}
                  {promo.discountType === 'PERCENTAGE' ? '%' : ''} OFF
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>最低消费:</span>
                    <span className="font-medium">RM {Number(promo.minPurchase).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>已使用:</span>
                    <span className="font-medium">{promo.usageCount} {promo.usageLimit ? `/ ${promo.usageLimit}` : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>开始时间:</span>
                    <span className="font-medium">{format(new Date(promo.startAt), 'MM-dd HH:mm')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>结束时间:</span>
                    <span className="font-medium">{format(new Date(promo.endAt), 'MM-dd HH:mm')}</span>
                  </div>
                </div>
              </Card>
            ))}

            {promotions.length === 0 && (
              <div className="col-span-full text-center py-10 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                暂无营销活动
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="创建新活动"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">活动名称</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-accent focus:border-accent"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">活动类型</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as any})}
              >
                <option value="FLASH_SALE">限时折扣</option>
                <option value="POINTS_BOOST">积分翻倍</option>
                <option value="SPEND_SAVE">满减活动</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">折扣类型</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.discountType}
                onChange={e => setFormData({...formData, discountType: e.target.value as any})}
              >
                <option value="FIXED">固定金额</option>
                <option value="PERCENTAGE">百分比</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">折扣数值</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.discountValue}
                onChange={e => setFormData({...formData, discountValue: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最低消费 (RM)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.minPurchase}
                onChange={e => setFormData({...formData, minPurchase: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
              <input
                type="datetime-local"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.startAt}
                onChange={e => setFormData({...formData, startAt: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
              <input
                type="datetime-local"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={formData.endAt}
                onChange={e => setFormData({...formData, endAt: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">总使用限制 (可选)</label>
            <input
              type="number"
              min="1"
              placeholder="留空则无限制"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={formData.usageLimit}
              onChange={e => setFormData({...formData, usageLimit: e.target.value})}
            />
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setShowCreateModal(false)}
            >
              取消
            </Button>
            <Button type="submit" fullWidth>
              创建活动
            </Button>
          </div>
        </form>
      </Modal>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type as any}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}
