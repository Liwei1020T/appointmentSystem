/**
 * Admin Voucher List Page
 * 
 * Features:
 * - Voucher statistics cards
 * - Filter by status (all/active/inactive) and type
 * - Search by code or description
 * - Voucher cards grid display
 * - Create/Edit voucher modal
 * - Delete confirmation
 * - Distribute voucher
 * 
 * Phase 3.5: Admin Voucher Management
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAllVouchers,
  getVoucherStats,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  toggleVoucherStatus,
  type Voucher,
  type VoucherStatus,
  type VoucherType,
  type VoucherStats,
} from '@/services/adminVoucherService';
import { Badge, Button, Card, Input, StatsCard, Tabs } from '@/components';
import { Search } from 'lucide-react';

export default function AdminVoucherListPage() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [stats, setStats] = useState<VoucherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<VoucherStatus>('all');
  const [typeFilter, setTypeFilter] = useState<VoucherType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [deletingVoucherId, setDeletingVoucherId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
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
  }, [statusFilter, typeFilter, searchTerm]);

  async function loadData() {
    setLoading(true);
    setError(null);

    const { vouchers: vouchersData, error: vouchersError } = await getAllVouchers({
      status: statusFilter,
      type: typeFilter === 'all' ? undefined : typeFilter,
      searchTerm,
    });

    if (vouchersError) {
      setError(vouchersError);
      setLoading(false);
      return;
    }

    setVouchers(vouchersData || []);

    // Load stats only once
    if (!stats) {
      const { stats: statsData } = await getVoucherStats();
      setStats(statsData);
    }

    setLoading(false);
  }

  async function handleCreateOrUpdate() {
    if (!formData.code || !formData.name || formData.value <= 0 || !formData.valid_from || !formData.valid_until) {
      alert('请填写必填字段（代码、名称、优惠值、有效期）');
      return;
    }

    setLoading(true);

    const payload = {
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      type: formData.type,
      value: Number(formData.value),
      validFrom: formData.valid_from,
      validUntil: formData.valid_until,
      minOrderAmount: Number(formData.min_purchase) || 0,
      maxUses: formData.usage_limit ?? null,
      pointsCost: Number(formData.points_cost) || 0,
      description: formData.description?.trim() || '',
      active: formData.active,
    };

    if (editingVoucher) {
      const { voucher, error } = await updateVoucher(editingVoucher.id, payload);
      if (error) {
        alert(`Failed to update voucher: ${error}`);
      } else {
        setShowCreateModal(false);
        setEditingVoucher(null);
        resetForm();
        await loadData();
      }
    } else {
      const { voucher, error } = await createVoucher(payload);
      if (error) {
        alert(`Failed to create voucher: ${error}`);
      } else {
        setShowCreateModal(false);
        resetForm();
        await loadData();
      }
    }

    setLoading(false);
  }

  async function handleDelete(voucherId: string) {
    if (!confirm('Are you sure you want to delete this voucher?')) {
      return;
    }

    setLoading(true);
    const { success, error } = await deleteVoucher(voucherId);
    
    if (error) {
      alert(`Failed to delete voucher: ${error}`);
    } else {
      setDeletingVoucherId(null);
      await loadData();
    }
    
    setLoading(false);
  }

  async function handleToggleStatus(voucherId: string, currentStatus: boolean) {
    setLoading(true);
    const { success, error } = await toggleVoucherStatus(voucherId, !currentStatus);
    
    if (error) {
      alert(`Failed to toggle status: ${error}`);
    } else if (success) {
      await loadData();
    }
    
    setLoading(false);
  }

  function openEditModal(voucher: Voucher) {
    setEditingVoucher(voucher);
    const validFrom = voucher.valid_from || voucher.validFrom;
    const validUntil = voucher.valid_until || voucher.validUntil;
    setFormData({
      code: voucher.code,
      name: voucher.name || '',
      type: voucher.type,
      value: voucher.value,
      min_purchase: voucher.min_purchase || voucher.minPurchase || 0,
      points_cost: voucher.points_cost || voucher.pointsCost || 0,
      description: voucher.description || '',
      valid_from: validFrom
        ? (typeof validFrom === 'string' ? validFrom.slice(0, 10) : new Date(validFrom).toISOString().slice(0, 10))
        : '',
      valid_until: validUntil
        ? (typeof validUntil === 'string' ? validUntil.slice(0, 10) : new Date(validUntil).toISOString().slice(0, 10))
        : '',
      usage_limit: voucher.usage_limit || voucher.usageLimit || null,
      active: voucher.active ?? voucher.isActive ?? true,
    });
    setShowCreateModal(true);
  }

  function resetForm() {
    setFormData({
      code: '',
      name: '',
      type: 'fixed_amount',
      value: 0,
      min_purchase: 0,
      points_cost: 0,
      description: '',
      valid_from: '',
      valid_until: '',
      usage_limit: null,
      active: true,
    });
  }

  function formatCurrency(amount: number | undefined): string {
    return `RM ${(amount ?? 0).toFixed(2)}`;
  }

  function formatDate(dateString: string | Date | undefined): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN');
  }

  const totalCount = stats?.total_vouchers ?? vouchers.length;
  const activeCount = stats?.active_vouchers ?? vouchers.filter((v) => v.active).length;
  const inactiveCount = Math.max(totalCount - activeCount, vouchers.filter((v) => !v.active).length);
  const statusTabs = useMemo(
    () => [
      { id: 'all', label: `全部 (${totalCount})` },
      { id: 'active', label: `活跃 (${activeCount})` },
      { id: 'inactive', label: `停用 (${inactiveCount})` },
    ],
    [totalCount, activeCount, inactiveCount]
  );

  return (
    <div className="min-h-screen bg-ink-elevated p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/dashboard')}
            >
              ← 返回仪表板
            </Button>
            <h1 className="text-2xl font-bold text-text-primary mt-2">优惠券管理</h1>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setEditingVoucher(null);
              setShowCreateModal(true);
            }}
          >
            + 创建优惠券
          </Button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="总优惠券"
              value={stats.total_vouchers}
              trend={{ value: `活跃 ${stats.active_vouchers}`, isPositive: true }}
            />
            <StatsCard
              title="已分发"
              value={stats.total_distributed}
              trend={{ value: `已使用 ${stats.total_used}`, isPositive: true }}
            />
            <StatsCard
              title="使用率"
              value={`${stats.usage_rate}%`}
              trend={{ value: `${stats.total_used} / ${stats.total_distributed}`, isPositive: true }}
            />
            <StatsCard
              title="总优惠金额"
              value={formatCurrency(stats.total_discount_given)}
              trend={{ value: '已使用优惠券产生', isPositive: true }}
            />
          </div>
        )}

        {/* Filters */}
        <Card padding="md">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4">
            <Input
              label="搜索"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="优惠券代码或描述"
              leftIcon={<Search className="h-4 w-4" />}
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-text-secondary">类型</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as VoucherType | 'all')}
                className="w-full h-11 px-3 rounded-lg border bg-ink-surface text-text-primary border-border-subtle focus:outline-none focus:ring-2 focus:ring-accent-border focus:ring-offset-2 focus:ring-offset-ink"
              >
                <option value="all">全部类型</option>
                <option value="fixed_amount">固定金额</option>
                <option value="percentage">百分比</option>
              </select>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <Tabs
              tabs={statusTabs}
              activeTab={statusFilter}
              onChange={(tabId) => setStatusFilter(tabId as VoucherStatus)}
              className="min-w-max"
            />
          </div>
        </Card>

        {/* Loading/Error States */}
        {loading && (
          <Card padding="lg" className="text-center text-text-tertiary">
            加载中...
          </Card>
        )}

        {error && (
          <Card padding="sm" className="border-danger/30 bg-danger/10">
            <p className="text-sm text-danger">{error}</p>
          </Card>
        )}

        {/* Vouchers Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vouchers.length === 0 ? (
              <Card padding="lg" className="col-span-full text-center text-text-tertiary">
                暂无优惠券
              </Card>
            ) : (
              vouchers.map((voucher) => {
                const isActive = voucher.active ?? voucher.isActive ?? false;

                return (
                  <Card key={voucher.id} padding="lg" className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs text-text-tertiary">优惠券代码</p>
                        <p className="text-lg font-semibold text-text-primary tracking-tight">
                          {voucher.code}
                        </p>
                        {voucher.description && (
                          <p className="text-sm text-text-secondary mt-2">
                            {voucher.description}
                          </p>
                        )}
                      </div>
                      <Badge variant={isActive ? 'success' : 'neutral'} size="sm">
                        {isActive ? '活跃' : '停用'}
                      </Badge>
                    </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-tertiary">类型</span>
                      <span className="font-medium text-text-primary">
                        {voucher.type === 'fixed_amount' ? '固定金额' : '百分比'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-text-tertiary">优惠值</span>
                      <span className="font-semibold text-success font-mono">
                        {voucher.type === 'fixed_amount'
                          ? formatCurrency(voucher.value)
                          : `${voucher.value}%`}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-text-tertiary">积分成本</span>
                      <span className="font-medium text-text-primary font-mono">
                        {voucher.points_cost} 分
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-text-tertiary">最低消费</span>
                      <span className="font-medium text-text-primary font-mono">
                        {formatCurrency(voucher.min_purchase)}
                      </span>
                    </div>

                    {voucher.usage_limit && (
                      <div className="flex justify-between">
                        <span className="text-text-tertiary">使用限制</span>
                        <span className="font-medium text-text-primary">
                          {voucher.usage_limit} 次
                        </span>
                      </div>
                    )}

                    {voucher.valid_from && voucher.valid_until && (
                      <div className="pt-2 border-t border-border-subtle">
                        <p className="text-xs text-text-tertiary">有效期</p>
                        <p className="text-sm font-medium text-text-primary mt-1">
                          {formatDate(voucher.valid_from)} - {formatDate(voucher.valid_until)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      fullWidth
                      onClick={() => router.push(`/admin/vouchers/${voucher.id}`)}
                    >
                      查看详情
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      fullWidth
                      onClick={() => openEditModal(voucher)}
                    >
                      编辑
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      fullWidth
                      className={
                        isActive
                          ? 'bg-warning/15 text-warning border-warning/30 hover:bg-warning/25'
                          : 'bg-success/15 text-success border-success/30 hover:bg-success/25'
                      }
                      onClick={() => handleToggleStatus(voucher.id, isActive)}
                    >
                      {isActive ? '停用' : '启用'}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      fullWidth
                      onClick={() => handleDelete(voucher.id)}
                    >
                      删除
                    </Button>
                  </div>
                </Card>
                );
              })
            )}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-ink-surface border border-border-subtle">
              <div className="p-6 border-b border-border-subtle">
                <h2 className="text-xl font-bold text-text-primary">
                  {editingVoucher ? '编辑优惠券' : '创建优惠券'}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <Input
                  label="优惠券代码 *"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="SUMMER2024"
                  className="font-mono"
                />

                <Input
                  label="优惠券名称 *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="学生专享折扣"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-text-secondary">类型 *</label>
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
                    label="优惠值 *"
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                    placeholder={formData.type === 'fixed_amount' ? '10.00' : '10'}
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
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    描述
                  </label>
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

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 text-accent rounded focus:ring-2 focus:ring-accent-border"
                  />
                  <label htmlFor="active" className="text-sm font-medium text-text-secondary">
                    启用优惠券
                  </label>
                </div>
              </div>

              <div className="p-6 bg-ink-elevated border-t border-border-subtle flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingVoucher(null);
                    resetForm();
                  }}
                >
                  取消
                </Button>
                <Button onClick={handleCreateOrUpdate} loading={loading}>
                  {editingVoucher ? '更新' : '创建'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
