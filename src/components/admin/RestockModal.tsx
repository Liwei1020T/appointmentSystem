/**
 * 补货管理弹窗 (Restock Management Modal)
 * 
 * 功能：
 * - 选择球线
 * - 输入补货数量
 * - 记录成本价
 * - 添加补货说明
 * - 自动更新库存和记录日志
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { X, Package, DollarSign, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { addStock } from '@/services/inventoryService';

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedStringId?: string; // 预选的球线ID（从预警组件点击时传入）
}

interface StringOption {
  id: string;
  name: string;
  brand: string;
  model: string;
  currentStock: number;
  costPrice?: number;
}

export default function RestockModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedStringId,
}: RestockModalProps) {
  const { data: session } = useSession();
  const [strings, setStrings] = useState<StringOption[]>([]);
  const [selectedStringId, setSelectedStringId] = useState<string>(preselectedStringId || '');
  const [quantity, setQuantity] = useState<number>(10);
  const [costPerUnit, setCostPerUnit] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 加载球线列表
  useEffect(() => {
    if (isOpen) {
      loadStrings();
      if (preselectedStringId) {
        setSelectedStringId(preselectedStringId);
      }
    }
  }, [isOpen, preselectedStringId]);

  const loadStrings = async () => {
    try {
      const response = await fetch('/api/admin/strings?active=true');
      if (!response.ok) throw new Error('Failed to load strings');
      const data = await response.json();
      setStrings(
        data.map((s: any) => ({
          id: s.id,
          name: s.name,
          brand: s.brand,
          model: s.model,
          currentStock: s.stock_quantity || 0,
          costPrice: s.cost_price,
        }))
      );
    } catch (err) {
      console.error('Failed to load strings:', err);
    }
  };

  // 获取当前选中的球线信息
  const selectedString = strings.find((s) => s.id === selectedStringId);

  // 处理补货
  const handleRestock = async () => {
    // 验证输入
    if (!selectedStringId) {
      setError('请选择球线');
      return;
    }

    if (quantity <= 0) {
      setError('补货数量必须大于 0');
      return;
    }

    if (!reason.trim()) {
      setError('请填写补货原因');
      return;
    }

    setLoading(true);
    setError(null);

    // 使用 session 中的用户ID（管理员）
    const userId = session?.user?.id;

    if (!userId) {
      setError('未登录');
      setLoading(false);
      return;
    }

    // 执行补货
    const { success: restockSuccess, error: restockError } = await addStock({
      stringId: selectedStringId,
      quantity,
      costPerUnit: costPerUnit ? parseFloat(costPerUnit) : undefined,
      reason: reason.trim(),
      adminId: userId,
      metadata: {
        supplier: reason.includes('供应商') ? reason : undefined,
      },
    });

    setLoading(false);

    if (restockError) {
      setError(restockError);
      return;
    }

    if (restockSuccess) {
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 1500);
    }
  };

  // 关闭弹窗
  const handleClose = () => {
    setSelectedStringId('');
    setQuantity(10);
    setCostPerUnit('');
    setReason('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 标题栏 */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">补货管理</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 表单内容 */}
        <div className="p-6 space-y-6">
          {/* 成功提示 */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="text-green-800">补货成功！库存已更新。</p>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* 选择球线 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择球线 <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedStringId}
              onChange={(e) => setSelectedStringId(e.target.value)}
              disabled={loading || success}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
            >
              <option value="">-- 请选择球线 --</option>
              {strings.map((string) => (
                <option key={string.id} value={string.id}>
                  {string.brand} {string.model} - {string.name} (当前库存: {string.currentStock})
                </option>
              ))}
            </select>

            {/* 当前球线信息 */}
            {selectedString && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-blue-900">
                  <Package className="w-4 h-4" />
                  <span className="font-medium">当前库存：</span>
                  <span className="text-lg font-bold">{selectedString.currentStock}</span>
                  {selectedString.costPrice && (
                    <>
                      <span className="mx-2">|</span>
                      <span className="font-medium">当前成本价：</span>
                      <span>RM {selectedString.costPrice.toFixed(2)}</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 补货数量 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              补货数量 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              disabled={loading || success}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
              placeholder="输入补货数量"
            />
            {selectedString && quantity > 0 && (
              <p className="mt-2 text-sm text-gray-600">
                补货后库存：
                <span className="font-semibold text-green-600 ml-1">
                  {selectedString.currentStock + quantity}
                </span>
              </p>
            )}
          </div>

          {/* 成本价（可选） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              成本价 (RM) <span className="text-gray-500 text-xs">(可选)</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
                disabled={loading || success}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
                placeholder="例如: 18.50"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              填写本次进货的单价，系统将自动计算平均成本
            </p>
          </div>

          {/* 补货原因 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              补货说明 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={loading || success}
                rows={3}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
                placeholder="例如：从 Yonex Malaysia 供应商采购，发票号 INV-2024-001"
              />
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleRestock}
            disabled={loading || success || !selectedStringId || quantity <= 0 || !reason.trim()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>处理中...</span>
              </>
            ) : (
              <>
                <Package className="w-4 h-4" />
                <span>确认补货</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
