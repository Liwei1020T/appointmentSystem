/**
 * Admin Voucher Detail Page
 * 
 * Features:
 * - Voucher information display
 * - Edit voucher form
 * - Usage statistics
 * - List of users who have this voucher
 * - Distribute voucher to more users
 * 
 * Phase 3.5: Admin Voucher Management
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getVoucherById,
  getUserVouchers,
  updateVoucher,
  deleteVoucher,
  toggleVoucherStatus,
  type Voucher,
  type UserVoucher,
  type VoucherType,
} from '@/services/adminVoucherService';
import DistributeVoucherModal from './DistributeVoucherModal';

interface AdminVoucherDetailPageProps {
  voucherId: string;
}

export default function AdminVoucherDetailPage({ voucherId }: AdminVoucherDetailPageProps) {
  const router = useRouter();
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [userVouchers, setUserVouchers] = useState<UserVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDistributeModal, setShowDistributeModal] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    type: 'fixed_amount' as VoucherType,
    value: 0,
    min_purchase: 0,
    points_cost: 0,
    description: '',
    valid_from: '',
    valid_until: '',
    usage_limit: null as number | null,
    active: true,
  });

  useEffect(() => {
    loadData();
  }, [voucherId]);

  async function loadData() {
    setLoading(true);
    setError(null);

    const { voucher: voucherData, error: voucherError } = await getVoucherById(voucherId);
    
    if (voucherError) {
      setError(voucherError);
      setLoading(false);
      return;
    }

    setVoucher(voucherData);
    
    if (voucherData) {
      const validFrom = voucherData.valid_from || voucherData.validFrom;
      const validUntil = voucherData.valid_until || voucherData.validUntil;
      setFormData({
        code: voucherData.code,
        type: voucherData.type,
        value: voucherData.value,
        min_purchase: voucherData.min_purchase || voucherData.minPurchase || 0,
        points_cost: voucherData.points_cost || voucherData.pointsCost || 0,
        description: voucherData.description || '',
        valid_from: validFrom ? (typeof validFrom === 'string' ? validFrom : validFrom.toISOString().split('T')[0]) : '',
        valid_until: validUntil ? (typeof validUntil === 'string' ? validUntil : validUntil.toISOString().split('T')[0]) : '',
        usage_limit: voucherData.usage_limit || voucherData.usageLimit || null,
        active: voucherData.active ?? voucherData.isActive ?? true,
      });
    }

    const { data: userVouchersData } = await getUserVouchers(voucherId);
    setUserVouchers(userVouchersData || []);

    setLoading(false);
  }

  async function handleUpdate() {
    if (!voucher) return;

    setLoading(true);
    const { voucher: updated, error } = await updateVoucher(voucher.id, {
      ...formData,
      usage_limit: formData.usage_limit ?? undefined,
    });
    
    if (error) {
      alert(`Failed to update: ${error}`);
    } else {
      setIsEditing(false);
      await loadData();
    }
    
    setLoading(false);
  }

  async function handleDelete() {
    if (!voucher) return;
    if (!confirm('确定要删除这个优惠券吗？此操作不可恢复。')) return;

    setLoading(true);
    const { success, error } = await deleteVoucher(voucher.id);
    
    if (error) {
      alert(`Failed to delete: ${error}`);
      setLoading(false);
    } else {
      router.push('/admin/vouchers');
    }
  }

  async function handleToggleStatus() {
    if (!voucher) return;

    setLoading(true);
    const { error } = await toggleVoucherStatus(voucher.id, !voucher.active);
    
    if (error) {
      alert(`Failed to toggle status: ${error}`);
    } else {
      await loadData();
    }
    
    setLoading(false);
  }

  function formatCurrency(amount: number | undefined): string {
    return `¥${(amount ?? 0).toFixed(2)}`;
  }

  function formatDate(dateString: string | Date | undefined): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  function formatDateTime(dateString: string | Date | undefined): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN');
  }

  function getStatusBadge(status: string | undefined) {
    const s = status || 'available';
    const badges = {
      available: 'bg-success/15 text-success',
      used: 'bg-ink-elevated text-text-secondary',
      expired: 'bg-danger/15 text-danger',
    };
    
    const labels = {
      available: '可用',
      used: '已使用',
      expired: '已过期',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[s as keyof typeof badges] || badges.available}`}>
        {labels[s as keyof typeof labels] || s}
      </span>
    );
  }

  if (loading && !voucher) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12 text-text-tertiary">加载中...</div>
      </div>
    );
  }

  if (error || !voucher) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-danger/10 border border-danger/40 text-danger px-4 py-3 rounded-lg">
          {error || '优惠券不存在'}
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalDistributed = userVouchers.length;
  const totalUsed = userVouchers.filter(uv => uv.status === 'used').length;
  const totalExpired = userVouchers.filter(uv => uv.status === 'expired').length;
  const totalAvailable = userVouchers.filter(uv => uv.status === 'available').length;
  const usageRate = totalDistributed > 0 ? ((totalUsed / totalDistributed) * 100).toFixed(1) : '0.0';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/vouchers')}
            className="text-text-secondary hover:text-text-primary"
          >
            ← 返回列表
          </button>
          <h1 className="text-3xl font-bold text-text-primary">{voucher.code}</h1>
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              voucher.active
                ? 'bg-success/15 text-success'
                : 'bg-ink-elevated text-text-secondary'
            }`}
          >
            {voucher.active ? '活跃' : '停用'}
          </span>
        </div>

        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => setShowDistributeModal(true)}
                className="px-4 py-2 bg-accent text-text-onAccent rounded-lg hover:shadow-glow"
              >
                分发优惠券
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-accent text-text-onAccent rounded-lg hover:shadow-glow"
              >
                编辑
              </button>
              <button
                onClick={handleToggleStatus}
                className={`px-4 py-2 rounded-lg ${
                  voucher.active
                    ? 'bg-warning/15 text-warning hover:bg-warning/25'
                    : 'bg-success/15 text-success hover:bg-success/25'
                }`}
              >
                {voucher.active ? '停用' : '启用'}
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-danger text-text-primary rounded-lg hover:bg-danger/90"
              >
                删除
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-border-subtle rounded-lg text-text-secondary hover:bg-ink-elevated"
              >
                取消
              </button>
              <button
                onClick={handleUpdate}
                disabled={loading}
                className="px-4 py-2 bg-accent text-text-onAccent rounded-lg hover:shadow-glow disabled:bg-ink-elevated"
              >
                {loading ? '保存中...' : '保存更改'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Voucher Info / Edit Form */}
          <div className="bg-ink-surface rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">优惠券信息</h2>

            {isEditing ? (
              <div className="space-y-4">
                {/* Code */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    优惠券代码
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-ink-surface text-text-primary focus:ring-2 focus:ring-accent-border"
                  />
                </div>

                {/* Type & Value */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">类型</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as VoucherType })}
                      className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-ink-surface text-text-primary focus:ring-2 focus:ring-accent-border"
                    >
                      <option value="fixed_amount">固定金额</option>
                      <option value="percentage">百分比</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">优惠值</label>
                    <input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                      step="0.01"
                      className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-ink-surface text-text-primary focus:ring-2 focus:ring-accent-border"
                    />
                  </div>
                </div>

                {/* Min Purchase & Points Cost */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">最低消费 (¥)</label>
                    <input
                      type="number"
                      value={formData.min_purchase}
                      onChange={(e) => setFormData({ ...formData, min_purchase: parseFloat(e.target.value) || 0 })}
                      step="0.01"
                      className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-ink-surface text-text-primary focus:ring-2 focus:ring-accent-border"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">积分成本</label>
                    <input
                      type="number"
                      value={formData.points_cost}
                      onChange={(e) => setFormData({ ...formData, points_cost: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-ink-surface text-text-primary focus:ring-2 focus:ring-accent-border"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">描述</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-ink-surface text-text-primary focus:ring-2 focus:ring-accent-border"
                  />
                </div>

                {/* Valid Period */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">开始日期</label>
                    <input
                      type="date"
                      value={formData.valid_from}
                      onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                      className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-ink-surface text-text-primary focus:ring-2 focus:ring-accent-border"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">结束日期</label>
                    <input
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                      className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-ink-surface text-text-primary focus:ring-2 focus:ring-accent-border"
                    />
                  </div>
                </div>

                {/* Usage Limit */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">使用限制 (次)</label>
                  <input
                    type="number"
                    value={formData.usage_limit || ''}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="不限制留空"
                    className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-ink-surface text-text-primary focus:ring-2 focus:ring-accent-border"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-text-secondary">类型</span>
                  <span className="font-medium">
                    {voucher.type === 'fixed_amount' ? '固定金额' : '百分比'}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b">
                  <span className="text-text-secondary">优惠值</span>
                  <span className="font-bold text-success">
                    {voucher.type === 'fixed_amount'
                      ? formatCurrency(voucher.value)
                      : `${voucher.value}%`}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b">
                  <span className="text-text-secondary">积分成本</span>
                  <span className="font-medium">{voucher.points_cost} 分</span>
                </div>

                <div className="flex justify-between py-2 border-b">
                  <span className="text-text-secondary">最低消费</span>
                  <span className="font-medium">{formatCurrency(voucher.min_purchase)}</span>
                </div>

                {voucher.description && (
                  <div className="py-2 border-b">
                    <div className="text-text-secondary mb-1">描述</div>
                    <div className="text-sm">{voucher.description}</div>
                  </div>
                )}

                {voucher.valid_from && voucher.valid_until && (
                  <div className="py-2 border-b">
                    <div className="text-text-secondary mb-1">有效期</div>
                    <div className="text-sm font-medium">
                      {formatDate(voucher.valid_from)} - {formatDate(voucher.valid_until)}
                    </div>
                  </div>
                )}

                {voucher.usage_limit && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-text-secondary">使用限制</span>
                    <span className="font-medium">{voucher.usage_limit} 次</span>
                  </div>
                )}

                <div className="flex justify-between py-2">
                  <span className="text-text-secondary">创建时间</span>
                  <span className="text-sm">{formatDateTime(voucher.created_at)}</span>
                </div>

                {voucher.updated_at && (
                  <div className="flex justify-between py-2">
                    <span className="text-text-secondary">更新时间</span>
                    <span className="text-sm">{formatDateTime(voucher.updated_at)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Vouchers Table */}
          <div className="bg-ink-surface rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">用户持有列表</h2>

            {userVouchers.length === 0 ? (
              <div className="text-center py-8 text-text-tertiary">
                暂无用户持有此优惠券
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-ink-elevated">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">用户</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">手机</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">状态</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">获得时间</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">使用时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {userVouchers.map((uv) => (
                      <tr key={uv.id} className="hover:bg-ink-elevated">
                        <td className="px-4 py-3">
                          <div className="font-medium">{uv.user?.full_name}</div>
                          <div className="text-sm text-text-tertiary">{uv.user?.email}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">{uv.user?.phone || '-'}</td>
                        <td className="px-4 py-3">{getStatusBadge(uv.status)}</td>
                        <td className="px-4 py-3 text-sm">{formatDateTime(uv.created_at)}</td>
                        <td className="px-4 py-3 text-sm">
                          {uv.used_at ? formatDateTime(uv.used_at) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Usage Stats */}
          <div className="bg-ink-surface rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4">使用统计</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-text-secondary">总分发</span>
                <span className="font-bold text-accent">{totalDistributed}</span>
              </div>

              <div className="flex justify-between py-2 border-b">
                <span className="text-text-secondary">已使用</span>
                <span className="font-bold text-success">{totalUsed}</span>
              </div>

              <div className="flex justify-between py-2 border-b">
                <span className="text-text-secondary">已过期</span>
                <span className="font-bold text-danger">{totalExpired}</span>
              </div>

              <div className="flex justify-between py-2 border-b">
                <span className="text-text-secondary">可用中</span>
                <span className="font-bold text-text-primary">{totalAvailable}</span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-text-secondary">使用率</span>
                <span className="font-bold text-accent">{usageRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Distribute Modal */}
      {showDistributeModal && (
        <DistributeVoucherModal
          voucherId={voucherId}
          voucherCode={voucher.code}
          onClose={() => setShowDistributeModal(false)}
          onSuccess={() => loadData()}
        />
      )}
    </div>
  );
}
