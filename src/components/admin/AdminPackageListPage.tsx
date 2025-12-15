/**
 * Admin Package List Page
 * 
 * Displays all packages with filtering, stats, and management actions.
 * Allows admins to view, create, edit, and manage packages.
 * 
 * Phase 3.4: Admin Package Management
 */

'use client';

import React, { useState, useEffect } from 'react';
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
      validity_days: pkg.validity_days,
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
  const formatCurrency = (amount: number) => {
    return `RM ${amount.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="text-gray-600 hover:text-gray-900 mb-2 flex items-center text-sm"
            >
              ← 返回仪表板
            </button>
            <h1 className="text-2xl font-bold text-gray-900">套餐管理</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            + 创建新套餐
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-500">总套餐数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_packages}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.active_packages} 个上架中
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-500">总销售量</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_purchases}</p>
              <p className="text-xs text-green-600 mt-1">
                本月 {stats.this_month_purchases} 笔
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-500">总收入</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.total_revenue)}</p>
              <p className="text-xs text-green-600 mt-1">
                本月 {formatCurrency(stats.this_month_revenue)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-sm text-gray-500">最受欢迎</p>
              <p className="text-lg font-bold text-gray-900">
                {stats.most_popular_package?.name || '暂无数据'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.most_popular_package ? `${stats.most_popular_package.purchase_count} 次购买` : ''}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜索套餐名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex gap-2 mt-4 border-b border-gray-200">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                statusFilter === 'all'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              全部 ({packages.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                statusFilter === 'active'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              上架中 ({packages.filter(p => p.active).length})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                statusFilter === 'inactive'
                  ? 'border-gray-600 text-gray-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              已下架 ({packages.filter(p => !p.active).length})
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-sm text-red-600 hover:text-red-800 mt-2"
            >
              关闭
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <>
            {/* Packages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {packages.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500">暂无套餐数据</p>
                </div>
              ) : (
                packages.map((pkg) => {
                  const purchases = getPurchaseCount(pkg.id);
                  const salesInfo = salesData.find(s => s.package_id === pkg.id);
                  
                  return (
                    <div
                      key={pkg.id}
                      className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                    >
                      {/* Package Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
                          {pkg.description && (
                            <p className="text-sm text-gray-500 mt-1">{pkg.description}</p>
                          )}
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            pkg.active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {pkg.active ? '上架中' : '已下架'}
                        </span>
                      </div>

                      {/* Package Details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">包含次数</span>
                          <span className="font-semibold text-gray-900">{pkg.times} 次</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">有效期</span>
                          <span className="font-semibold text-gray-900">{pkg.validity_days} 天</span>
                        </div>
                        <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                          <span className="text-gray-600">价格</span>
                          <span className="font-bold text-purple-600 text-lg">
                            {formatCurrency(pkg.price)}
                          </span>
                        </div>
                      </div>

                      {/* Sales Info */}
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">总销售</span>
                          <span className="font-semibold text-gray-900">{purchases} 笔</span>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-gray-600">销售额</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(salesInfo?.total_revenue || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-gray-600">活跃用户</span>
                          <span className="font-semibold text-blue-600">
                            {salesInfo?.active_users || 0} 人
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/admin/packages/${pkg.id}`)}
                          className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          查看详情
                        </button>
                        <button
                          onClick={() => openEditModal(pkg)}
                          className="flex-1 px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleToggleStatus(pkg)}
                          className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                            pkg.active
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {pkg.active ? '下架' : '上架'}
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(pkg)}
                          className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Create/Edit Package Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {showCreateModal ? '创建新套餐' : '编辑套餐'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    套餐名称 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="例如: 5次套餐"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    包含次数 *
                  </label>
                  <input
                    type="number"
                    value={formData.times}
                    onChange={(e) => setFormData({ ...formData, times: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    价格 (RM) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    min="0"
                  />
                  {formData.times > 0 && formData.price > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      平均每次: {formatCurrency(formData.price / formData.times)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    有效期 (天) *
                  </label>
                  <input
                    type="number"
                    value={formData.validity_days}
                    onChange={(e) => setFormData({ ...formData, validity_days: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="套餐说明..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    立即上架
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    showCreateModal ? setShowCreateModal(false) : setShowEditModal(false);
                    resetForm();
                    setSelectedPackage(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={showCreateModal ? handleCreate : handleEdit}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  {showCreateModal ? '创建' : '保存'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && selectedPackage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">确认删除</h3>
              <p className="text-gray-600 mb-6">
                确定要删除套餐 <span className="font-semibold">{selectedPackage.name}</span> 吗？
                此操作不可撤销。
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedPackage(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
