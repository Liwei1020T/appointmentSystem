/**
 * Admin Package List Page
 * 
 * Displays all packages with filtering, stats, and management actions.
 * Allows admins to view, create, edit, and manage packages.
 * 
 * Phase 3.4: Admin Package Management
 */

'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAllPackages,
  getPackageStats,
  getPackageSalesData,
  deletePackage,
  togglePackageStatus,
  createPackage,
  updatePackage,
  type Package,
  type PackageStatus,
  type PackageStats,
  type PackageSalesData,
} from '@/services/adminPackageService';
import { Badge, Button, Card, Input, StatsCard, Tabs } from '@/components';
import { Search } from 'lucide-react';

export default function AdminPackageListPage() {
  const router = useRouter();

  // State management
  const [packages, setPackages] = useState<Package[]>([]);
  const [stats, setStats] = useState<PackageStats | null>(null);
  const [salesData, setSalesData] = useState<PackageSalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<PackageStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    times: 5,
    price: 0,
    validity_days: 90,
    active: true,
    description: '',
  });

  // Fetch data on component mount and filter change
  useEffect(() => {
    fetchData();
  }, [statusFilter, searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [packagesResult, statsResult, salesResult] = await Promise.all([
        getAllPackages({ status: statusFilter, searchTerm: searchTerm.trim() || undefined }),
        getPackageStats(),
        getPackageSalesData(),
      ]);

      if (packagesResult.error) {
        setError(packagesResult.error);
      } else {
        setPackages(packagesResult.packages || []);
      }

      if (!statsResult.error && statsResult.stats) {
        setStats(statsResult.stats);
      }

      if (!salesResult.error && salesResult.salesData) {
        setSalesData(salesResult.salesData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  // Handle create package
  const handleCreate = async () => {
    if (!formData.name || formData.price <= 0) {
      setError('Please fill in all required fields');
      return;
    }

    const { package: newPackage, error: createError } = await createPackage(formData);

    if (createError || !newPackage) {
      setError(createError || 'Failed to create package');
      return;
    }

    setShowCreateModal(false);
    resetForm();
    fetchData();
  };

  // Handle edit package
  const handleEdit = async () => {
    if (!selectedPackage) return;

    const { package: updatedPackage, error: updateError } = await updatePackage(
      selectedPackage.id,
      formData
    );

    if (updateError) {
      setError(updateError);
      return;
    }

    setShowEditModal(false);
    setSelectedPackage(null);
    resetForm();
    fetchData();
  };

  // Handle delete package
  const handleDelete = async () => {
    if (!selectedPackage) return;

    const { success, error: deleteError } = await deletePackage(selectedPackage.id);

    if (!success || deleteError) {
      setError(deleteError || 'Failed to delete package');
      setShowDeleteConfirm(false);
      return;
    }

    setShowDeleteConfirm(false);
    setSelectedPackage(null);
    fetchData();
  };

  // Handle toggle status
  const handleToggleStatus = async (pkg: Package) => {
    const { error: toggleError } = await togglePackageStatus(pkg.id, !pkg.active);

    if (toggleError) {
      setError(toggleError);
      return;
    }

    fetchData();
  };

  // Open edit modal
  const openEditModal = (pkg: Package) => {
    setSelectedPackage(pkg);
    setFormData({
      name: pkg.name,
      times: pkg.times,
      price: pkg.price,
      // 兼容 Prisma 字段 validityDays（camelCase）与旧字段 validity_days（snake_case）
      validity_days: (pkg as any).validity_days ?? (pkg as any).validityDays ?? 0,
      active: pkg.active,
      description: pkg.description || '',
    });
    setShowEditModal(true);
  };

  // Open delete confirm
  const openDeleteConfirm = (pkg: Package) => {
    setSelectedPackage(pkg);
    setShowDeleteConfirm(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      times: 5,
      price: 0,
      validity_days: 90,
      active: true,
      description: '',
    });
  };

  // Get purchase count for a package
  const getPurchaseCount = (packageId: string) => {
    const data = salesData.find(s => s.package_id === packageId);
    return data?.total_sold || 0;
  };

  // Format currency
  const formatCurrency = (amount: number | string | null | undefined) => {
    const numeric = Number(amount ?? 0);
    if (Number.isNaN(numeric)) return 'RM 0.00';
    return `RM ${numeric.toFixed(2)}`;
  };

  const totalCount = stats?.total_packages ?? packages.length;
  const activeCount = stats?.active_packages ?? packages.filter((pkg) => pkg.active).length;
  const inactiveCount = Math.max(totalCount - activeCount, packages.filter((pkg) => !pkg.active).length);
  const statusTabs = useMemo(
    () => [
      { id: 'all', label: `全部 (${totalCount})` },
      { id: 'active', label: `上架中 (${activeCount})` },
      { id: 'inactive', label: `已下架 (${inactiveCount})` },
    ],
    [totalCount, activeCount, inactiveCount]
  );

  return (
    <div className="min-h-screen bg-ink-elevated p-6">
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
            <h1 className="text-2xl font-bold text-text-primary mt-2">套餐管理</h1>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>+ 创建新套餐</Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
              title="总套餐数"
              value={stats.total_packages}
              trend={{ value: `${stats.active_packages} 个上架中`, isPositive: true }}
            />
            <StatsCard
              title="总销售量"
              value={stats.total_purchases}
              trend={{ value: `本月 ${stats.this_month_purchases} 笔`, isPositive: true }}
            />
            <StatsCard
              title="总收入"
              value={formatCurrency(stats.total_revenue)}
              trend={{ value: `本月 ${formatCurrency(stats.this_month_revenue)}`, isPositive: true }}
            />
            <Card padding="md">
              <p className="text-sm text-text-tertiary">最受欢迎</p>
              <p className="text-lg font-bold text-text-primary mt-1">
                {stats.most_popular_package?.name || '暂无数据'}
              </p>
              <p className="text-xs text-text-tertiary mt-1">
                {stats.most_popular_package ? `${stats.most_popular_package.purchase_count} 次购买` : '暂无购买记录'}
              </p>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card padding="md" className="mb-6">
          <Input
            placeholder="搜索套餐名称..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />

          <div className="mt-4 overflow-x-auto">
            <Tabs
              tabs={statusTabs}
              activeTab={statusFilter}
              onChange={(tabId) => setStatusFilter(tabId as PackageStatus)}
              className="min-w-max"
            />
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <Card padding="sm" className="border-danger/30 bg-danger/10">
            <p className="text-sm text-danger">{error}</p>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              关闭
            </Button>
          </Card>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          </div>
        ) : (
          <>
            {/* Packages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {packages.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-text-tertiary">暂无套餐数据</p>
                </div>
              ) : (
                packages.map((pkg) => {
                  const purchases = getPurchaseCount(pkg.id);
                  const salesInfo = salesData.find(s => s.package_id === pkg.id);
                  
                  return (
                    <Card
                      key={pkg.id}
                      padding="lg"
                      className="hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-text-primary">{pkg.name}</h3>
                          {pkg.description && (
                            <p className="text-sm text-text-tertiary mt-1">{pkg.description}</p>
                          )}
                        </div>
                        <Badge variant={pkg.active ? 'success' : 'neutral'} size="sm">
                          {pkg.active ? '上架中' : '已下架'}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-text-secondary">包含次数</span>
                          <span className="font-semibold text-text-primary">{pkg.times} 次</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-text-secondary">有效期</span>
                          <span className="font-semibold text-text-primary">
                            {(pkg as any).validity_days ?? (pkg as any).validityDays ?? 0} 天
                          </span>
                        </div>
                        <div className="flex justify-between text-sm border-t border-border-subtle pt-2">
                          <span className="text-text-secondary">价格</span>
                          <span className="font-bold text-accent text-lg font-mono">
                            {formatCurrency(pkg.price)}
                          </span>
                        </div>
                      </div>

                      <div className="bg-ink-elevated rounded-lg p-3 mb-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-text-secondary">总销售</span>
                          <span className="font-semibold text-text-primary font-mono">{purchases} 笔</span>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-text-secondary">销售额</span>
                          <span className="font-semibold text-success font-mono">
                            {formatCurrency(salesInfo?.total_revenue || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-text-secondary">活跃用户</span>
                          <span className="font-semibold text-info font-mono">
                            {salesInfo?.active_users || 0} 人
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => router.push(`/admin/packages/${pkg.id}`)}
                        >
                          查看详情
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="flex-1"
                          onClick={() => openEditModal(pkg)}
                        >
                          编辑
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`flex-1 ${pkg.active ? 'text-warning bg-warning/15 hover:bg-warning/25' : 'text-success bg-success/15 hover:bg-success/25'}`}
                          onClick={() => handleToggleStatus(pkg)}
                        >
                          {pkg.active ? '下架' : '上架'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-danger bg-danger/10 hover:bg-danger/20"
                          onClick={() => openDeleteConfirm(pkg)}
                        >
                          删除
                        </Button>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Create/Edit Package Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-ink-surface rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-text-primary mb-4">
                {showCreateModal ? '创建新套餐' : '编辑套餐'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    套餐名称 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-border-subtle bg-ink-elevated text-text-primary rounded-lg focus:ring-2 focus:ring-accent"
                    placeholder="例如: 5次套餐"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    包含次数 *
                  </label>
                  <input
                    type="number"
                    value={formData.times}
                    onChange={(e) => setFormData({ ...formData, times: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-border-subtle bg-ink-elevated text-text-primary rounded-lg focus:ring-2 focus:ring-accent"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    价格 (RM) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-border-subtle bg-ink-elevated text-text-primary rounded-lg focus:ring-2 focus:ring-accent"
                    min="0"
                  />
                  {formData.times > 0 && formData.price > 0 && (
                    <p className="text-xs text-text-tertiary mt-1">
                      平均每次: {formatCurrency(formData.price / formData.times)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    有效期 (天) *
                  </label>
                  <input
                    type="number"
                    value={formData.validity_days}
                    onChange={(e) => setFormData({ ...formData, validity_days: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-border-subtle bg-ink-elevated text-text-primary rounded-lg focus:ring-2 focus:ring-accent"
                    min="1"
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
                    className="w-full px-3 py-2 border border-border-subtle bg-ink-elevated text-text-primary rounded-lg focus:ring-2 focus:ring-accent"
                    placeholder="套餐说明..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="h-4 w-4 text-accent focus:ring-accent border-border-subtle rounded"
                  />
                  <label className="ml-2 block text-sm text-text-secondary">
                    立即上架
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => {
                    showCreateModal ? setShowCreateModal(false) : setShowEditModal(false);
                    resetForm();
                    setSelectedPackage(null);
                  }}
                >
                  取消
                </Button>
                <Button onClick={showCreateModal ? handleCreate : handleEdit}>
                  {showCreateModal ? '创建' : '保存'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && selectedPackage && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-ink-surface rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-text-primary mb-4">确认删除</h3>
              <p className="text-text-secondary mb-6">
                确定要删除套餐 <span className="font-semibold">{selectedPackage.name}</span> 吗？
                此操作不可撤销。
              </p>

              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedPackage(null);
                  }}
                >
                  取消
                </Button>
                <Button variant="danger" onClick={handleDelete}>
                  确认删除
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
