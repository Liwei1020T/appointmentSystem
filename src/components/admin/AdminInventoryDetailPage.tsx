/**
 * Admin Inventory Detail Page
 * 
 * Displays and allows editing of a single string inventory item.
 * Includes stock adjustment functionality and stock change history.
 * 
 * Phase 3.3: Admin Inventory Management
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getStringById,
  updateString,
  deleteString,
  adjustStock,
  getStockLogs,
  type StringInventory,
  type StockLog,
  type StockChangeType,
} from '@/services/inventory.service';

interface AdminInventoryDetailPageProps {
  stringId: string;
}

export default function AdminInventoryDetailPage({ stringId }: AdminInventoryDetailPageProps) {
  const router = useRouter();

  // State management
  const [string, setString] = useState<StringInventory | null>(null);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    cost_price: 0,
    selling_price: 0,
    stock_quantity: 0,
    minimum_stock: 0,
    description: '',
  });

  // Stock adjustment state
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [stockAdjustmentData, setStockAdjustmentData] = useState({
    changeAmount: 0,
    type: 'addition' as StockChangeType,
    reason: '',
  });

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch string details and stock logs
  useEffect(() => {
    fetchStringData();
    fetchStockLogs();
  }, [stringId]);

  const fetchStringData = async () => {
    setLoading(true);
    setError(null);

    try {
      const fetchedString = await getStringById(stringId);

      if (!fetchedString) {
        setError('String not found');
        setLoading(false);
        return;
      }

      setString(fetchedString);
      
      setFormData({
        name: fetchedString.model,
        brand: fetchedString.brand,
        cost_price: Number(fetchedString.costPrice),
        selling_price: Number(fetchedString.sellingPrice),
        stock_quantity: fetchedString.stock,
        minimum_stock: fetchedString.minimumStock,
        description: '',
      });

      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load string');
      setLoading(false);
    }
  };

  const fetchStockLogs = async () => {
    try {
      const logs = await getStockLogs(stringId);
      setStockLogs(logs);
    } catch (err) {
      console.error('Failed to fetch stock logs:', err);
    }
  };

  // Handle form field change
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle save changes
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updatedString = await updateString(stringId, {
        model: formData.name,
        brand: formData.brand,
        costPrice: formData.cost_price,
        sellingPrice: formData.selling_price,
        minimumStock: formData.minimum_stock,
      } as any);

      setString(updatedString);
      setSuccessMessage('保存成功！');
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }

    // Clear success message after 3 seconds
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Handle stock adjustment
  const handleStockAdjustment = async () => {
    if (stockAdjustmentData.changeAmount === 0) {
      setError('请输入库存变更数量');
      return;
    }

    setSaving(true);
    setError(null);

    const { string: updatedString, error: adjustError } = await adjustStock({
      stringId,
      changeAmount: stockAdjustmentData.changeAmount,
      type: stockAdjustmentData.type,
      reason: stockAdjustmentData.reason || undefined,
    });

    if (adjustError) {
      setError(adjustError);
      setSaving(false);
      return;
    }

    setString(updatedString);
    setShowStockAdjustment(false);
    setStockAdjustmentData({
      changeAmount: 0,
      type: 'addition',
      reason: '',
    });

    // Refresh stock logs
    fetchStockLogs();

    setSuccessMessage('库存调整成功！');
    setSaving(false);

    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Handle delete
  const handleDelete = async () => {
    setSaving(true);
    setError(null);

    const { success, error: deleteError } = await deleteString(stringId);

    if (deleteError || !success) {
      setError(deleteError || 'Failed to delete string');
      setSaving(false);
      return;
    }

    // Navigate back to list
    router.push('/admin/inventory');
  };

  // Get stock status badge
  const getStockBadge = () => {
    if (!string) return null;
    
    if (string.stock === 0) {
      return <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-700 rounded-full">缺货</span>;
    } else if (string.stock < string.minimumStock) {
      return <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-700 rounded-full">库存不足</span>;
    } else {
      return <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-700 rounded-full">库存充足</span>;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get change type display
  const getChangeTypeDisplay = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      addition: { label: '入库', color: 'text-green-600' },
      deduction: { label: '出库', color: 'text-red-600' },
      adjustment: { label: '调整', color: 'text-blue-600' },
      return: { label: '退货', color: 'text-yellow-600' },
      purchase: { label: '购买', color: 'text-purple-600' },
      restock: { label: '补货', color: 'text-green-600' },
    };
    return types[type] || { label: type, color: 'text-gray-600' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error && !string) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
          <button
            onClick={() => router.push('/admin/inventory')}
            className="mt-4 text-purple-600 hover:text-purple-700"
          >
            ← 返回库存列表
          </button>
        </div>
      </div>
    );
  }

  const costPrice = string?.costPrice ? parseFloat(string.costPrice.toString()) : 0;
  const sellingPrice = string?.sellingPrice ? parseFloat(string.sellingPrice.toString()) : 0;
  const profit = sellingPrice - costPrice;
  const profitMargin = sellingPrice > 0 ? ((profit / sellingPrice) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/inventory')}
            className="text-gray-600 hover:text-gray-900 mb-2 flex items-center text-sm"
          >
            ← 返回库存列表
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{string?.brand} {string?.model}</h1>
              <div className="flex items-center gap-3 mt-2">
                {getStockBadge()}
                <span className="text-sm text-gray-500">
                  库存: {string?.stock} 条
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStockAdjustment(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                调整库存
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-700">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Edit Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    球线名称 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    品牌 *
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => handleFieldChange('brand', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    成本价 (RM) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => handleFieldChange('cost_price', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    售价 (RM) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={(e) => handleFieldChange('selling_price', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    当前库存
                  </label>
                  <input
                    type="number"
                    value={formData.stock_quantity}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">使用 &quot;调整库存&quot; 按钮修改</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最低库存警戒值 *
                  </label>
                  <input
                    type="number"
                    value={formData.minimum_stock}
                    onChange={(e) => handleFieldChange('minimum_stock', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="球线特性、适用人群等..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => router.push('/admin/inventory')}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? '保存中...' : '保存更改'}
                </button>
              </div>
            </div>

            {/* Stock History Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">库存变更记录</h2>
              
              {stockLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无库存变更记录</p>
              ) : (
                <div className="space-y-4">
                  {stockLogs.map((log) => {
                    const changeType = getChangeTypeDisplay(log.type);
                    return (
                      <div key={log.id} className="flex items-start gap-4 border-b border-gray-100 pb-4 last:border-0">
                        <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-purple-500"></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className={`text-sm font-medium ${changeType.color}`}>
                                {changeType.label}
                              </span>
                              <span className={`ml-2 text-sm font-bold ${log.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {log.change > 0 ? '+' : ''}{log.change}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatDate(log.createdAt?.toString() || '')}
                            </span>
                          </div>
                          {log.notes && (
                            <p className="text-sm text-gray-600 mt-1">{log.notes}</p>
                          )}
                          {log.createdBy && (
                            <p className="text-xs text-gray-500 mt-1">
                              操作人: {log.createdBy}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Stats & Info */}
          <div className="space-y-6">
            {/* Profit Stats Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">利润分析</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">成本价</p>
                  <p className="text-lg font-semibold text-gray-900">RM {costPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">售价</p>
                  <p className="text-lg font-semibold text-gray-900">RM {sellingPrice.toFixed(2)}</p>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <p className="text-xs text-gray-500">单条利润</p>
                  <p className="text-xl font-bold text-green-600">
                    RM {profit.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">利润率</p>
                  <p className="text-lg font-semibold text-green-600">{profitMargin}%</p>
                </div>
              </div>
            </div>

            {/* Stock Info Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">库存信息</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">当前库存</p>
                  <p className="text-2xl font-bold text-gray-900">{string?.stock} 条</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">最低库存</p>
                  <p className="text-lg font-semibold text-gray-700">{string?.minimumStock} 条</p>
                </div>
                {string && string.stock < string.minimumStock && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                    <p className="text-xs text-yellow-800">
                      ⚠️ 库存不足 {string.minimumStock - string.stock} 条
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Timestamps Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">时间信息</h3>
              
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-500">创建时间</p>
                  <p className="text-gray-900">{string && string.createdAt ? formatDate(string.createdAt.toString()) : '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">最后更新</p>
                  <p className="text-gray-900">{string && string.updatedAt ? formatDate(string.updatedAt.toString()) : '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Adjustment Modal */}
        {showStockAdjustment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">调整库存</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    变更类型
                  </label>
                  <select
                    value={stockAdjustmentData.type}
                    onChange={(e) => setStockAdjustmentData(prev => ({ 
                      ...prev, 
                      type: e.target.value as StockChangeType 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="addition">入库（增加）</option>
                    <option value="deduction">出库（减少）</option>
                    <option value="adjustment">调整</option>
                    <option value="return">退货</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    变更数量 *
                  </label>
                  <input
                    type="number"
                    value={stockAdjustmentData.changeAmount}
                    onChange={(e) => setStockAdjustmentData(prev => ({ 
                      ...prev, 
                      changeAmount: parseInt(e.target.value) 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder={stockAdjustmentData.type === 'deduction' ? '输入负数或正数后选择出库' : '输入数量'}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    入库/退货请输入正数，出库请输入负数
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    备注/原因
                  </label>
                  <textarea
                    value={stockAdjustmentData.reason}
                    onChange={(e) => setStockAdjustmentData(prev => ({ 
                      ...prev, 
                      reason: e.target.value 
                    }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="补货、损坏、盘点调整等..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowStockAdjustment(false);
                    setStockAdjustmentData({ changeAmount: 0, type: 'addition', reason: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleStockAdjustment}
                  disabled={saving}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {saving ? '处理中...' : '确认调整'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">确认删除</h3>
              <p className="text-gray-600 mb-6">
                确定要删除 <span className="font-semibold">{string?.brand} {string?.model}</span> 吗？
                此操作不可撤销。
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? '删除中...' : '确认删除'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
