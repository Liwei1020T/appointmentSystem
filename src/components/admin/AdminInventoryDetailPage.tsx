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
} from '@/services/inventoryService';
import { Badge, Button, Card, Input, StatsCard } from '@/components';
import PageLoading from '@/components/loading/PageLoading';
import { AlertTriangle } from 'lucide-react';

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
    imageUrl: '',
    isRecommended: false,
    elasticity: '',
    durability: '',
    control: '',
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
        description: (fetchedString as any).description || '',
        imageUrl: fetchedString.imageUrl || '',
        isRecommended: (fetchedString as any).isRecommended || false,
        elasticity: (fetchedString as any).elasticity || '',
        durability: (fetchedString as any).durability || '',
        control: (fetchedString as any).control || '',
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
        description: formData.description || null,
        imageUrl: formData.imageUrl || null,
        isRecommended: formData.isRecommended,
        elasticity: formData.elasticity || null,
        durability: formData.durability || null,
        control: formData.control || null,
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
      return <Badge variant="error">缺货</Badge>;
    }
    if (string.stock < string.minimumStock) {
      return <Badge variant="warning">库存不足</Badge>;
    }
    return <Badge variant="success">库存充足</Badge>;
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
      addition: { label: '入库', color: 'text-success' },
      deduction: { label: '出库', color: 'text-danger' },
      adjustment: { label: '调整', color: 'text-info' },
      return: { label: '退货', color: 'text-warning' },
      purchase: { label: '购买', color: 'text-accent' },
      restock: { label: '补货', color: 'text-success' },
    };
    return types[type] || { label: type, color: 'text-text-secondary' };
  };

  if (loading) {
    return <PageLoading surface="dark" />;
  }

  if (error && !string) {
    return (
      <div className="min-h-screen bg-ink-elevated p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-danger/10 border border-danger/40 rounded-lg p-4">
            <p className="text-danger">{error}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-4"
            onClick={() => router.push('/admin/inventory')}
          >
            ← 返回库存列表
          </Button>
        </div>
      </div>
    );
  }

  const costPrice = string?.costPrice ? parseFloat(string.costPrice.toString()) : 0;
  const sellingPrice = string?.sellingPrice ? parseFloat(string.sellingPrice.toString()) : 0;
  const profit = sellingPrice - costPrice;
  const profitMargin = sellingPrice > 0 ? ((profit / sellingPrice) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen bg-ink-elevated p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/inventory')}
            >
              ← 返回库存列表
            </Button>
            <h1 className="text-2xl font-bold text-text-primary mt-2">
              {string?.brand} {string?.model}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              {getStockBadge()}
              <span className="text-sm text-text-tertiary font-mono">
                库存: {string?.stock} 条
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowStockAdjustment(true)}>调整库存</Button>
            <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
              删除
            </Button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <Card padding="sm" className="border-success/30 bg-success/10">
            <p className="text-success">{successMessage}</p>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card padding="sm" className="border-danger/30 bg-danger/10">
            <p className="text-danger">{error}</p>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Edit Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-text-primary mb-4">基本信息</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="球线名称 *"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                />

                <Input
                  label="品牌 *"
                  value={formData.brand}
                  onChange={(e) => handleFieldChange('brand', e.target.value)}
                />

                <Input
                  label="成本价 (RM) *"
                  type="number"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={(e) => handleFieldChange('cost_price', parseFloat(e.target.value))}
                  className="font-mono"
                />

                <Input
                  label="售价 (RM) *"
                  type="number"
                  step="0.01"
                  value={formData.selling_price}
                  onChange={(e) => handleFieldChange('selling_price', parseFloat(e.target.value))}
                  className="font-mono"
                />

                <Input
                  label="当前库存"
                  type="number"
                  value={formData.stock_quantity}
                  disabled
                  helperText='使用 "调整库存" 按钮修改'
                  className="font-mono"
                />

                <Input
                  label="最低库存警戒值 *"
                  type="number"
                  value={formData.minimum_stock}
                  onChange={(e) => handleFieldChange('minimum_stock', parseInt(e.target.value))}
                  className="font-mono"
                />

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-ink-surface text-text-primary focus:ring-2 focus:ring-accent-border focus:border-transparent"
                    placeholder="球线特性、适用人群等..."
                  />
                </div>

                <div className="md:col-span-2">
                  <Input
                    label="图片 URL"
                    value={formData.imageUrl}
                    onChange={(e) => handleFieldChange('imageUrl', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.imageUrl && (
                    <div className="mt-2 flex items-center gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-ink-surface border border-border-subtle">
                        <img
                          src={formData.imageUrl}
                          alt="预览"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <span className="text-xs text-text-tertiary">图片预览</span>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={formData.isRecommended}
                        onChange={(e) => handleFieldChange('isRecommended', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-ink-surface border border-border-subtle rounded-full peer peer-checked:bg-accent peer-checked:border-accent transition-colors"></div>
                      <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-text-primary">推荐球线</span>
                      <p className="text-xs text-text-tertiary">开启后将在用户端显示"推荐"标签</p>
                    </div>
                  </label>
                </div>

                {/* String Characteristics */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-sm font-medium text-text-secondary">球线特性</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Elasticity */}
                    <div>
                      <label className="block text-xs text-text-tertiary mb-2">弹性</label>
                      <div className="flex gap-2">
                        {['low', 'medium', 'high'].map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => handleFieldChange('elasticity', formData.elasticity === level ? '' : level)}
                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${formData.elasticity === level
                              ? 'bg-accent text-white'
                              : 'bg-ink-surface border border-border-subtle text-text-secondary hover:border-accent/50'
                              }`}
                          >
                            {level === 'low' ? '低' : level === 'medium' ? '中' : '高'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Durability */}
                    <div>
                      <label className="block text-xs text-text-tertiary mb-2">耐久</label>
                      <div className="flex gap-2">
                        {['low', 'medium', 'high'].map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => handleFieldChange('durability', formData.durability === level ? '' : level)}
                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${formData.durability === level
                              ? 'bg-accent text-white'
                              : 'bg-ink-surface border border-border-subtle text-text-secondary hover:border-accent/50'
                              }`}
                          >
                            {level === 'low' ? '低' : level === 'medium' ? '中' : '高'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Control */}
                    <div>
                      <label className="block text-xs text-text-tertiary mb-2">控球</label>
                      <div className="flex gap-2">
                        {['low', 'medium', 'high'].map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => handleFieldChange('control', formData.control === level ? '' : level)}
                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${formData.control === level
                              ? 'bg-accent text-white'
                              : 'bg-ink-surface border border-border-subtle text-text-secondary hover:border-accent/50'
                              }`}
                          >
                            {level === 'low' ? '低' : level === 'medium' ? '中' : '高'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="secondary" onClick={() => router.push('/admin/inventory')}>
                  取消
                </Button>
                <Button onClick={handleSave} loading={saving} disabled={saving}>
                  保存更改
                </Button>
              </div>
            </Card>

            {/* Stock History Card */}
            <Card padding="lg">
              <h2 className="text-lg font-semibold text-text-primary mb-4">库存变更记录</h2>

              {stockLogs.length === 0 ? (
                <p className="text-text-tertiary text-center py-8">暂无库存变更记录</p>
              ) : (
                <div className="space-y-4">
                  {stockLogs.map((log) => {
                    const changeType = getChangeTypeDisplay(log.type);
                    return (
                      <div key={log.id} className="flex items-start gap-4 border-b border-border-subtle pb-4 last:border-0">
                        <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-accent"></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className={`text-sm font-medium ${changeType.color}`}>
                                {changeType.label}
                              </span>
                              <span className={`ml-2 text-sm font-bold font-mono ${log.change > 0 ? 'text-success' : 'text-danger'}`}>
                                {log.change > 0 ? '+' : ''}{log.change}
                              </span>
                            </div>
                            <span className="text-xs text-text-tertiary">
                              {formatDate(log.createdAt?.toString() || '')}
                            </span>
                          </div>
                          {log.notes && (
                            <p className="text-sm text-text-secondary mt-1">{log.notes}</p>
                          )}
                          {log.createdBy && (
                            <p className="text-xs text-text-tertiary mt-1">
                              操作人: {log.createdBy}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Stats & Info */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatsCard
                title="单条利润"
                value={`RM ${profit.toFixed(2)}`}
                className="border-success/30"
              />
              <StatsCard
                title="利润率"
                value={`${profitMargin}%`}
                className="border-success/20"
              />
            </div>

            <Card padding="lg">
              <h3 className="text-sm font-medium text-text-secondary mb-4">库存信息</h3>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-text-tertiary">当前库存</p>
                  <p className="text-2xl font-bold text-text-primary font-mono">{string?.stock} 条</p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">最低库存</p>
                  <p className="text-lg font-semibold text-text-secondary font-mono">{string?.minimumStock} 条</p>
                </div>
                {string && string.stock < string.minimumStock && (
                  <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 mt-3">
                    <p className="text-xs text-warning flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> 库存不足 {string.minimumStock - string.stock} 条
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <Card padding="lg">
              <h3 className="text-sm font-medium text-text-secondary mb-4">时间信息</h3>

              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-text-tertiary">创建时间</p>
                  <p className="text-text-primary">{string && string.createdAt ? formatDate(string.createdAt.toString()) : '-'}</p>
                </div>
                <div>
                  <p className="text-text-tertiary">最后更新</p>
                  <p className="text-text-primary">{string && string.updatedAt ? formatDate(string.updatedAt.toString()) : '-'}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Stock Adjustment Modal */}
        {showStockAdjustment && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-ink-surface rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-text-primary mb-4">调整库存</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    变更类型
                  </label>
                  <select
                    value={stockAdjustmentData.type}
                    onChange={(e) => setStockAdjustmentData(prev => ({
                      ...prev,
                      type: e.target.value as StockChangeType
                    }))}
                    className="w-full h-11 px-3 border border-border-subtle rounded-lg bg-ink-elevated text-text-primary focus:ring-2 focus:ring-accent-border"
                  >
                    <option value="addition">入库（增加）</option>
                    <option value="deduction">出库（减少）</option>
                    <option value="adjustment">调整</option>
                    <option value="return">退货</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    变更数量 *
                  </label>
                  <input
                    type="number"
                    value={stockAdjustmentData.changeAmount}
                    onChange={(e) => setStockAdjustmentData(prev => ({
                      ...prev,
                      changeAmount: parseInt(e.target.value)
                    }))}
                    className="w-full h-11 px-3 border border-border-subtle rounded-lg bg-ink-elevated text-text-primary focus:ring-2 focus:ring-accent-border font-mono"
                    placeholder={stockAdjustmentData.type === 'deduction' ? '输入负数或正数后选择出库' : '输入数量'}
                  />
                  <p className="text-xs text-text-tertiary mt-1">
                    入库/退货请输入正数，出库请输入负数
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    备注/原因
                  </label>
                  <textarea
                    value={stockAdjustmentData.reason}
                    onChange={(e) => setStockAdjustmentData(prev => ({
                      ...prev,
                      reason: e.target.value
                    }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-ink-elevated text-text-primary focus:ring-2 focus:ring-accent-border"
                    placeholder="补货、损坏、盘点调整等..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowStockAdjustment(false);
                    setStockAdjustmentData({ changeAmount: 0, type: 'addition', reason: '' });
                  }}
                >
                  取消
                </Button>
                <Button
                  onClick={handleStockAdjustment}
                  disabled={saving}
                  loading={saving}
                >
                  确认调整
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-ink-surface rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-text-primary mb-4">确认删除</h3>
              <p className="text-text-secondary mb-6">
                确定要删除 <span className="font-semibold">{string?.brand} {string?.model}</span> 吗？
                此操作不可撤销。
              </p>

              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  取消
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  disabled={saving}
                  loading={saving}
                >
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
