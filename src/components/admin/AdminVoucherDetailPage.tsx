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
import { Badge, Button, Card, Input, StatsCard } from '@/components';
import PageLoading from '@/components/loading/PageLoading';
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
    max_redemptions_per_user: 1, // 每用户兑换上限
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
        max_redemptions_per_user: voucherData.maxRedemptionsPerUser || voucherData.max_redemptions_per_user || 1,
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
    const isActive = voucher.active ?? voucher.isActive ?? false;
    const { error } = await toggleVoucherStatus(voucher.id, !isActive);

    if (error) {
      alert(`Failed to toggle status: ${error}`);
    } else {
      await loadData();
    }

    setLoading(false);
  }

  function formatCurrency(amount: number | undefined): string {
    return `RM ${(amount ?? 0).toFixed(2)}`;
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
    const labels = {
      available: '可用',
      used: '已使用',
      expired: '已过期',
    };

    const variants = {
      available: 'success',
      used: 'neutral',
      expired: 'error',
    } as const;

    return (
      <Badge variant={variants[s as keyof typeof variants] || 'neutral'} size="sm">
        {labels[s as keyof typeof labels] || s}
      </Badge>
    );
  }

  if (loading && !voucher) {
    return <PageLoading surface="dark" />;
  }

  if (error || !voucher) {
    return (
      <div className="min-h-screen bg-ink p-6">
        <div className="max-w-4xl mx-auto">
          <Card padding="sm" className="border-danger/30 bg-danger/10">
            <p className="text-danger">{error || '优惠券不存在'}</p>
          </Card>
          <Button
            variant="ghost"
            size="sm"
            className="mt-4"
            onClick={() => router.push('/admin/vouchers')}
          >
            ← 返回优惠券列表
          </Button>
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
  const isActive = voucher.active ?? voucher.isActive ?? false;

  return (
    <div className="min-h-screen bg-ink p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/vouchers')}
        >
          ← 返回优惠券列表
        </Button>

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{voucher.code}</h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant={isActive ? 'success' : 'neutral'} size="sm">
                {isActive ? '活跃' : '停用'}
              </Badge>
              <span className="text-sm text-text-tertiary">
                {voucher.type === 'fixed_amount' ? '固定金额' : '百分比'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!isEditing ? (
              <>
                <Button onClick={() => setShowDistributeModal(true)}>分发优惠券</Button>
                <Button variant="secondary" onClick={() => setIsEditing(true)}>
                  编辑
                </Button>
                <Button
                  variant="secondary"
                  className={
                    isActive
                      ? 'bg-warning/15 text-warning border-warning/30 hover:bg-warning/25'
                      : 'bg-success/15 text-success border-success/30 hover:bg-success/25'
                  }
                  onClick={handleToggleStatus}
                >
                  {isActive ? '停用' : '启用'}
                </Button>
                <Button variant="danger" onClick={handleDelete}>
                  删除
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={() => setIsEditing(false)}>
                  取消
                </Button>
                <Button onClick={handleUpdate} loading={loading}>
                  保存更改
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Voucher Info / Edit Form */}
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-text-primary mb-4">优惠券信息</h2>

              {isEditing ? (
                <div className="space-y-4">
                  <Input
                    label="优惠券代码"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="font-mono"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-text-secondary">类型</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as VoucherType })}
                        className="w-full h-11 px-3 rounded-lg border bg-ink-surface text-text-primary border-border-subtle focus:outline-none focus:ring-2 focus:ring-accent-border focus:ring-offset-2 focus:ring-offset-ink"
                      >
                        <option value="fixed_amount">固定金额</option>
                        <option value="percentage">百分比</option>
                      </select>
                    </div>

                    <Input
                      label="优惠值"
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                      step="0.01"
                      helperText={formData.type === 'fixed_amount' ? 'RM' : '百分比'}
                      className="font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="最低消费 (RM)"
                      type="number"
                      value={formData.min_purchase}
                      onChange={(e) => setFormData({ ...formData, min_purchase: parseFloat(e.target.value) || 0 })}
                      step="0.01"
                      className="font-mono"
                    />
                    <Input
                      label="积分成本"
                      type="number"
                      value={formData.points_cost}
                      onChange={(e) => setFormData({ ...formData, points_cost: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">描述</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-ink-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-border focus:ring-offset-2 focus:ring-offset-ink"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="开始日期"
                      type="date"
                      value={formData.valid_from}
                      onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    />
                    <Input
                      label="结束日期"
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    />
                  </div>

                  <Input
                    label="使用限制 (次)"
                    type="number"
                    value={formData.usage_limit || ''}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="不限制留空"
                  />

                  <div className="space-y-1">
                    <Input
                      label="每用户兑换上限"
                      type="number"
                      min={1}
                      value={formData.max_redemptions_per_user}
                      onChange={(e) => setFormData({ ...formData, max_redemptions_per_user: parseInt(e.target.value) || 1 })}
                    />
                    <p className="text-xs text-text-tertiary">同一用户可兑换此优惠券的最大次数</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-border-subtle">
                    <span className="text-text-secondary">类型</span>
                    <span className="font-medium text-text-primary">
                      {voucher.type === 'fixed_amount' ? '固定金额' : '百分比'}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-border-subtle">
                    <span className="text-text-secondary">优惠值</span>
                    <span className="font-semibold text-success font-mono">
                      {voucher.type === 'fixed_amount'
                        ? formatCurrency(voucher.value)
                        : `${voucher.value}%`}
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-border-subtle">
                    <span className="text-text-secondary">积分成本</span>
                    <span className="font-medium text-text-primary font-mono">
                      {voucher.points_cost} 分
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-border-subtle">
                    <span className="text-text-secondary">最低消费</span>
                    <span className="font-medium text-text-primary font-mono">
                      {formatCurrency(voucher.min_purchase)}
                    </span>
                  </div>

                  {voucher.description && (
                    <div className="py-2 border-b border-border-subtle">
                      <div className="text-text-secondary mb-1">描述</div>
                      <div className="text-sm text-text-primary">{voucher.description}</div>
                    </div>
                  )}

                  {voucher.valid_from && voucher.valid_until && (
                    <div className="py-2 border-b border-border-subtle">
                      <div className="text-text-secondary mb-1">有效期</div>
                      <div className="text-sm font-medium text-text-primary">
                        {formatDate(voucher.valid_from)} - {formatDate(voucher.valid_until)}
                      </div>
                    </div>
                  )}

                  {voucher.usage_limit && (
                    <div className="flex justify-between py-2 border-b border-border-subtle">
                      <span className="text-text-secondary">使用限制</span>
                      <span className="font-medium text-text-primary">
                        {voucher.usage_limit} 次
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between py-2 border-b border-border-subtle">
                    <span className="text-text-secondary">每用户兑换上限</span>
                    <span className="font-medium text-text-primary">
                      {voucher.maxRedemptionsPerUser || voucher.max_redemptions_per_user || 1} 张
                    </span>
                  </div>

                  <div className="flex justify-between py-2 border-b border-border-subtle">
                    <span className="text-text-secondary">创建时间</span>
                    <span className="text-sm text-text-primary font-mono">
                      {formatDateTime(voucher.created_at || voucher.createdAt)}
                    </span>
                  </div>

                  <div className="flex justify-between py-2">
                    <span className="text-text-secondary">更新时间</span>
                    <span className="text-sm text-text-primary font-mono">
                      {formatDateTime(voucher.updated_at || voucher.updatedAt || voucher.created_at || voucher.createdAt)}
                    </span>
                  </div>
                </div>
              )}
            </Card>

            {/* User Vouchers Table */}
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-text-primary mb-4">用户持有列表</h2>

              {userVouchers.length === 0 ? (
                <div className="text-center py-8 text-text-tertiary">
                  暂无用户持有此优惠券
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border-subtle">
                    <thead className="bg-ink-elevated">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">用户</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">手机</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">状态</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">获得时间</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">使用时间</th>
                      </tr>
                    </thead>
                    <tbody className="bg-ink-surface divide-y divide-border-subtle">
                      {userVouchers.map((uv) => (
                        <tr key={uv.id} className="hover:bg-ink">
                          <td className="px-4 py-3">
                            <div className="font-medium text-text-primary">{uv.user?.full_name}</div>
                            <div className="text-sm text-text-tertiary">{uv.user?.email}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-text-primary">{uv.user?.phone || '-'}</td>
                          <td className="px-4 py-3">{getStatusBadge(uv.status)}</td>
                          <td className="px-4 py-3 text-sm text-text-primary font-mono">
                            {formatDateTime(uv.created_at)}
                          </td>
                          <td className="px-4 py-3 text-sm text-text-primary font-mono">
                            {uv.used_at ? formatDateTime(uv.used_at) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatsCard title="总分发" value={totalDistributed} />
              <StatsCard title="已使用" value={totalUsed} className="border-success/30" />
              <StatsCard title="已过期" value={totalExpired} className="border-danger/30" />
              <StatsCard title="可用中" value={totalAvailable} />
            </div>
            <StatsCard title="使用率" value={`${usageRate}%`} className="border-info/30" />
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
    </div>
  );
}
