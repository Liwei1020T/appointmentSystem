/**
 * Admin Inventory List Page
 * 
 * Displays all string inventory items with filtering, search, and stock alerts.
 * Allows admins to view, search, filter, and manage string inventory.
 * 
 * Phase 3.3: Admin Inventory Management
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAllStrings,
  getLowStockAlerts,
  getAllBrands,
  type StringInventory,
  type StockStatus,
  type LowStockAlert,
} from '@/services/inventoryService';

export default function AdminInventoryListPage() {
  const router = useRouter();

  // State management
  const [strings, setStrings] = useState<StringInventory[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlert[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and pagination state
  const [stockStatus, setStockStatus] = useState<StockStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalStrings, setTotalStrings] = useState(0);
  const itemsPerPage = 20;

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchData();
  }, [stockStatus, searchTerm, selectedBrand, currentPage]);

  // Fetch strings, alerts, and brands
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch strings with filters
      const { strings: fetchedStrings, total, error: stringsError } = await getAllStrings({
        stockStatus,
        searchTerm: searchTerm.trim() || undefined,
        brand: selectedBrand || undefined,
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      });

      if (stringsError) {
        setError(stringsError);
        return;
      }

      setStrings(fetchedStrings || []);
      setTotalStrings(total);

      // Fetch low stock alerts (only on initial load)
      if (lowStockAlerts.length === 0) {
        const { alerts, error: alertsError } = await getLowStockAlerts();
        if (!alertsError && alerts) {
          setLowStockAlerts(alerts);
        }
      }

      // Fetch brands (only on initial load)
      if (brands.length === 0) {
        const { brands: fetchedBrands, error: brandsError } = await getAllBrands();
        if (!brandsError && fetchedBrands) {
          setBrands(fetchedBrands);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  // Handle search with Enter key
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setCurrentPage(1);
      fetchData();
    }
  };

  // Handle filter change
  const handleFilterChange = (newStatus: StockStatus) => {
    setStockStatus(newStatus);
    setCurrentPage(1);
  };

  // Handle brand filter change
  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    setCurrentPage(1);
  };

  // Navigate to string detail page
  const handleViewDetail = (stringId: string) => {
    router.push(`/admin/inventory/${stringId}`);
  };

  // Navigate to add new string page
  const handleAddNew = () => {
    router.push('/admin/inventory/add');
  };

  // Calculate pagination
  const totalPages = Math.ceil(totalStrings / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalStrings);

  // Get stock status badge color
  const getStockBadge = (string: StringInventory) => {
    if (string.stock === 0) {
      return <span className="px-2 py-1 text-xs font-medium bg-danger/15 text-danger rounded-full">Out of Stock</span>;
    } else if (string.stock < string.minimumStock) {
      return <span className="px-2 py-1 text-xs font-medium bg-warning/15 text-warning rounded-full">Low Stock</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-medium bg-success/15 text-success rounded-full">In Stock</span>;
    }
  };

  // Count strings by status
  const allCount = totalStrings;
  const lowStockCount = lowStockAlerts.length;
  const outOfStockCount = strings.filter(s => s.stock === 0).length;

  return (
    <div className="min-h-screen bg-ink-elevated p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="text-text-secondary hover:text-text-primary mb-2 flex items-center text-sm"
            >
              ← 返回仪表板
            </button>
            <h1 className="text-2xl font-bold text-text-primary">库存管理</h1>
          </div>
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-accent text-text-onAccent rounded-lg hover:shadow-glow transition-colors"
          >
            + 添加新球线
          </button>
        </div>

        {/* Low Stock Alerts Banner */}
        {lowStockAlerts.length > 0 && (
          <div className="mb-6 bg-warning/10 border border-warning/30 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-warning" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-warning">
                  {lowStockAlerts.length} 种球线库存不足
                </h3>
                <div className="mt-2 text-sm text-warning">
                  <ul className="list-disc list-inside space-y-1">
                    {lowStockAlerts.slice(0, 3).map(alert => (
                      <li key={alert.id}>
                        {alert.brand} {alert.model}: {alert.stock} 条 (最低需要 {alert.minimumStock} 条)
                      </li>
                    ))}
                    {lowStockAlerts.length > 3 && (
                      <li className="text-warning">还有 {lowStockAlerts.length - 3} 种...</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-ink-surface rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜索球线名称或品牌..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="w-full px-4 py-2 border border-border-subtle bg-ink-elevated text-text-primary rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>

            {/* Brand Filter */}
            <select
              value={selectedBrand}
              onChange={(e) => handleBrandChange(e.target.value)}
              className="px-4 py-2 border border-border-subtle bg-ink-elevated text-text-primary rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              <option value="">所有品牌</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          {/* Stock Status Tabs */}
          <div className="flex gap-2 mt-4 border-b border-border-subtle">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${stockStatus === 'all'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
            >
              全部 ({allCount})
            </button>
            <button
              onClick={() => handleFilterChange('low_stock')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${stockStatus === 'low_stock'
                  ? 'border-warning text-warning'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
            >
              库存不足 ({lowStockCount})
            </button>
            <button
              onClick={() => handleFilterChange('out_of_stock')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${stockStatus === 'out_of_stock'
                  ? 'border-danger text-danger'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
            >
              缺货 ({outOfStockCount})
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-danger/15 border border-danger/40 rounded-lg p-4">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          </div>
        ) : (
          <>
            {/* Strings Table */}
            <div className="bg-ink-surface rounded-lg shadow-sm overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border-subtle">
                  <thead className="bg-ink-elevated">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        品牌
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        球线名称
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        成本价
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        售价
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        利润率
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        当前库存
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        最低库存
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-ink-surface divide-y divide-border-subtle">
                    {strings.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center text-text-tertiary">
                          <div className="flex flex-col items-center">
                            <svg className="h-12 w-12 text-text-tertiary mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p className="text-sm">暂无库存数据</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      strings.map((string) => {
                        const profitMargin = ((Number(string.sellingPrice) - Number(string.costPrice)) / Number(string.sellingPrice) * 100).toFixed(1);
                        return (
                          <tr
                            key={string.id}
                            onClick={() => handleViewDetail(string.id)}
                            className="hover:bg-ink-elevated cursor-pointer transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                              {string.brand}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                              {string.model}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                              RM {Number(string.costPrice).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-medium">
                              RM {Number(string.sellingPrice).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-success font-medium">
                              {profitMargin}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-semibold">
                              {string.stock}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text-tertiary">
                              {string.minimumStock}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStockBadge(string)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDetail(string.id);
                                }}
                                className="text-accent hover:text-accent/80 font-medium"
                              >
                                查看详情
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-ink-surface px-6 py-4 rounded-lg shadow-sm">
                <div className="text-sm text-text-secondary">
                  显示 {startIndex} 到 {endIndex} 条，共 {totalStrings} 条
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-border-subtle rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-ink-elevated"
                  >
                    上一页
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 border rounded-md text-sm ${currentPage === pageNum
                            ? 'bg-accent text-text-onAccent border-accent'
                            : 'border-border-subtle hover:bg-ink-elevated'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-border-subtle rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-ink-elevated"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
