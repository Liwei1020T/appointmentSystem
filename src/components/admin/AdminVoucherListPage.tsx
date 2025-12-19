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

import { useState, useEffect } from 'react';
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

export default function AdminVoucherListPage() {
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
    return `¥${(amount ?? 0).toFixed(2)}`;
  }

  function formatDate(dateString: string | Date | undefined): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN');
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary">优惠券管理</h1>
        <button
          onClick={() => {
            resetForm();
            setEditingVoucher(null);
            setShowCreateModal(true);
          }}
          className="px-4 py-2 bg-accent text-text-onAccent rounded-lg hover:shadow-glow"
        >
          创建优惠券
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-ink-surface p-6 rounded-lg shadow">
            <div className="text-sm text-text-tertiary mb-1">总优惠券</div>
            <div className="text-2xl font-bold text-text-primary">{stats.total_vouchers}</div>
            <div className="text-xs text-text-tertiary mt-1">
              活跃: {stats.active_vouchers}
            </div>
          </div>

          <div className="bg-ink-surface p-6 rounded-lg shadow">
            <div className="text-sm text-text-tertiary mb-1">已分发</div>
            <div className="text-2xl font-bold text-accent">{stats.total_distributed}</div>
            <div className="text-xs text-text-tertiary mt-1">
              已使用: {stats.total_used}
            </div>
          </div>

          <div className="bg-ink-surface p-6 rounded-lg shadow">
            <div className="text-sm text-text-tertiary mb-1">使用率</div>
            <div className="text-2xl font-bold text-success">{stats.usage_rate}%</div>
            <div className="text-xs text-text-tertiary mt-1">
              {stats.total_used} / {stats.total_distributed}
            </div>
          </div>

          <div className="bg-ink-surface p-6 rounded-lg shadow">
            <div className="text-sm text-text-tertiary mb-1">总优惠金额</div>
            <div className="text-2xl font-bold text-accent">
              {formatCurrency(stats.total_discount_given)}
            </div>
            <div className="text-xs text-text-tertiary mt-1">
              已使用优惠券产生
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-ink-surface p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              搜索
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="优惠券代码或描述"
              className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-ink-surface text-text-primary focus:ring-2 focus:ring-accent-border"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              状态
            </label>
            <div className="flex gap-2">
              {(['all', 'active', 'inactive'] as VoucherStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg border ${
                    statusFilter === status
                      ? 'bg-accent text-text-onAccent border-accent'
                      : 'bg-ink-surface text-text-secondary border-border-subtle hover:bg-ink-elevated'
                  }`}
                >
                  {status === 'all' ? '全部' : status === 'active' ? '活跃' : '停用'}
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              类型
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as VoucherType | 'all')}
              className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-ink-surface text-text-primary focus:ring-2 focus:ring-accent-border"
            >
              <option value="all">全部类型</option>
              <option value="fixed_amount">固定金额</option>
              <option value="percentage">百分比</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading/Error States */}
      {loading && (
        <div className="text-center py-12 text-text-tertiary">加载中...</div>
      )}

      {error && (
        <div className="bg-danger/10 border border-danger/40 text-danger px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Vouchers Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vouchers.length === 0 ? (
            <div className="col-span-full text-center py-12 text-text-tertiary">
              暂无优惠券
            </div>
          ) : (
            vouchers.map((voucher) => (
              <div
                key={voucher.id}
                className="bg-ink-surface rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                {/* Card Header */}
                <div className="p-6 border-b border-border-subtle">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-2xl font-bold text-accent">
                      {voucher.code}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        voucher.active
                          ? 'bg-success/15 text-success'
                          : 'bg-ink-elevated text-text-secondary'
                      }`}
                    >
                      {voucher.active ? '活跃' : '停用'}
                    </span>
                  </div>

                  {voucher.description && (
                    <p className="text-sm text-text-secondary mt-2">
                      {voucher.description}
                    </p>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-text-tertiary">类型</span>
                      <span className="text-sm font-medium">
                        {voucher.type === 'fixed_amount' ? '固定金额' : '百分比'}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-text-tertiary">优惠值</span>
                      <span className="text-sm font-bold text-success">
                        {voucher.type === 'fixed_amount'
                          ? formatCurrency(voucher.value)
                          : `${voucher.value}%`}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-text-tertiary">积分成本</span>
                      <span className="text-sm font-medium">
                        {voucher.points_cost} 分
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-sm text-text-tertiary">最低消费</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(voucher.min_purchase)}
                      </span>
                    </div>

                    {voucher.usage_limit && (
                      <div className="flex justify-between">
                        <span className="text-sm text-text-tertiary">使用限制</span>
                        <span className="text-sm font-medium">
                          {voucher.usage_limit} 次
                        </span>
                      </div>
                    )}

                    {voucher.valid_from && voucher.valid_until && (
                      <div className="pt-2 border-t border-border-subtle">
                        <div className="text-xs text-text-tertiary">有效期</div>
                        <div className="text-sm font-medium mt-1">
                          {formatDate(voucher.valid_from)} - {formatDate(voucher.valid_until)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-4 bg-ink-elevated border-t border-border-subtle flex gap-2">
                  <a
                    href={`/admin/vouchers/${voucher.id}`}
                    className="flex-1 px-3 py-2 text-center text-sm bg-accent text-text-onAccent rounded hover:shadow-glow"
                  >
                    查看详情
                  </a>
                  <button
                    onClick={() => openEditModal(voucher)}
                    className="px-3 py-2 text-sm bg-ink-elevated text-text-secondary rounded hover:bg-ink-elevated"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleToggleStatus(voucher.id, voucher.active ?? voucher.isActive ?? false)}
                    className={`px-3 py-2 text-sm rounded ${
                      (voucher.active ?? voucher.isActive)
                        ? 'bg-warning/15 text-warning hover:bg-warning/25'
                        : 'bg-success/15 text-success hover:bg-success/20'
                    }`}
                  >
                    {(voucher.active ?? voucher.isActive) ? '停用' : '启用'}
                  </button>
                  <button
                    onClick={() => handleDelete(voucher.id)}
                    className="px-3 py-2 text-sm bg-danger/15 text-danger rounded hover:bg-danger/20"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-ink/70 flex items-center justify-center p-4 z-50">
          <div className="bg-ink-surface rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border-subtle">
              <h2 className="text-2xl font-bold">
                {editingVoucher ? '编辑优惠券' : '创建优惠券'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  优惠券代码 *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="SUMMER2024"
                  className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-ink-surface text-text-primary focus:ring-2 focus:ring-accent-border"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  优惠券名称 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="学生专享折扣"
                  className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-ink-surface text-text-primary focus:ring-2 focus:ring-accent-border"
                />
              </div>

              {/* Type & Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    类型 *
                  </label>
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
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    优惠值 *
                  </label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                    placeholder={formData.type === 'fixed_amount' ? '10.00' : '10'}
                    step="0.01"
                    className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-ink-surface text-text-primary focus:ring-2 focus:ring-accent-border"
                  />
                  <div className="text-xs text-text-tertiary mt-1">
                    {formData.type === 'fixed_amount' ? '元' : '百分比'}
                  </div>
                </div>
              </div>

              {/* Min Purchase & Points Cost */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    最低消费 (¥)
                  </label>
                  <input
                    type="number"
                    value={formData.min_purchase}
                    onChange={(e) => setFormData({ ...formData, min_purchase: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                    className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-ink-surface text-text-primary focus:ring-2 focus:ring-accent-border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    积分成本
                  </label>
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
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  描述
                </label>
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
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    开始日期
                  </label>
                  <input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-ink-surface text-text-primary focus:ring-2 focus:ring-accent-border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    结束日期
                  </label>
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
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  使用限制 (次)
                </label>
                <input
                  type="number"
                  value={formData.usage_limit || ''}
                  onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="不限制留空"
                  className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-ink-surface text-text-primary focus:ring-2 focus:ring-accent-border"
                />
              </div>

              {/* Active Status */}
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
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingVoucher(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-border-subtle rounded-lg text-text-secondary hover:bg-ink-elevated"
              >
                取消
              </button>
              <button
                onClick={handleCreateOrUpdate}
                disabled={loading}
                className="px-4 py-2 bg-accent text-text-onAccent rounded-lg hover:shadow-glow disabled:bg-ink-elevated"
              >
                {loading ? '处理中...' : editingVoucher ? '更新' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
