/**
 * Add New String Inventory Page
 * 
 * Allows admins to create a new string inventory item.
 * 
 * Phase 3.3: Admin Inventory Management
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createInventoryItem } from '@/services/inventoryService';

function AddStringForm() {
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    cost_price: 0,
    selling_price: 0,
    stock_quantity: 0,
    minimum_stock: 5,
    description: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle form field change
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.brand) {
      setError('请填写球线名称和品牌');
      return;
    }

    if (formData.cost_price <= 0 || formData.selling_price <= 0) {
      setError('成本价和售价必须大于0');
      return;
    }

    if (formData.selling_price <= formData.cost_price) {
      setError('售价必须高于成本价');
      return;
    }

    setSaving(true);
    setError(null);

    let newString;
    try {
      newString = await createInventoryItem({
        name: formData.name,
        brand: formData.brand,
        cost_price: formData.cost_price,
        selling_price: formData.selling_price,
        stock_quantity: formData.stock_quantity,
        minimum_stock: formData.minimum_stock,
        description: formData.description || undefined,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create string');
      setSaving(false);
      return;
    }

    if (!newString) {
      setError('Failed to create string');
      setSaving(false);
      return;
    }

    // Navigate to detail page
    router.push(`/admin/inventory/${newString.id}`);
  };

  // Calculate profit margin
  const profitMargin = formData.selling_price > 0 
    ? ((formData.selling_price - formData.cost_price) / formData.selling_price * 100).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen bg-ink-elevated p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/inventory')}
            className="text-text-secondary hover:text-text-primary mb-2 flex items-center text-sm"
          >
            ← 返回库存列表
          </button>
          <h1 className="text-2xl font-bold text-text-primary">添加新球线</h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-danger/15 border border-danger/40 rounded-lg p-4">
            <p className="text-danger">{error}</p>
          </div>
        )}

        {/* Form Card */}
        <form onSubmit={handleSubmit}>
          <div className="bg-ink-surface rounded-lg shadow-sm p-6">
            <div className="space-y-6">
              {/* Basic Info Section */}
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-4">基本信息</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      球线名称 *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-border-subtle bg-ink-elevated text-text-primary rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                      placeholder="例如: BG80"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      品牌 *
                    </label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => handleFieldChange('brand', e.target.value)}
                      className="w-full px-3 py-2 border border-border-subtle bg-ink-elevated text-text-primary rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                      placeholder="例如: YONEX"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      描述
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-border-subtle bg-ink-elevated text-text-primary rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                      placeholder="球线特性、适用人群等..."
                    />
                  </div>
                </div>
              </div>

              {/* Pricing Section */}
              <div className="border-t border-border-subtle pt-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">定价信息</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      成本价 (RM) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cost_price}
                      onChange={(e) => handleFieldChange('cost_price', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-border-subtle bg-ink-elevated text-text-primary rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      售价 (RM) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.selling_price}
                      onChange={(e) => handleFieldChange('selling_price', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-border-subtle bg-ink-elevated text-text-primary rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                {/* Profit Display */}
                {formData.selling_price > 0 && formData.cost_price > 0 && (
                  <div className="mt-4 p-4 bg-success/15 border border-success/40 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-text-secondary">单条利润</p>
                        <p className="text-xl font-bold text-success">
                          RM {(formData.selling_price - formData.cost_price).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-text-secondary">利润率</p>
                        <p className="text-xl font-bold text-success">{profitMargin}%</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Stock Section */}
              <div className="border-t border-border-subtle pt-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">库存信息</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      初始库存数量
                    </label>
                    <input
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => handleFieldChange('stock_quantity', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-border-subtle bg-ink-elevated text-text-primary rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                      placeholder="0"
                      min="0"
                    />
                    <p className="text-xs text-text-tertiary mt-1">可以先设为0，之后再补货</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      最低库存警戒值 *
                    </label>
                    <input
                      type="number"
                      value={formData.minimum_stock}
                      onChange={(e) => handleFieldChange('minimum_stock', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-border-subtle bg-ink-elevated text-text-primary rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                      placeholder="5"
                      min="0"
                      required
                    />
                    <p className="text-xs text-text-tertiary mt-1">低于此值时会显示警告</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => router.push('/admin/inventory')}
                className="px-6 py-2 border border-border-subtle rounded-lg hover:bg-ink-elevated transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-accent text-text-onAccent rounded-lg hover:shadow-glow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '创建中...' : '创建球线'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AddStringPage() {
  return <AddStringForm />;
}
