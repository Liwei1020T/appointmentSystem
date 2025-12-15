/**
 * 退款管理面板组件
 * 
 * 用途：
 * - 显示订单的退款记录
 * - 审批退款申请（批准/拒绝）
 * - 处理退款（执行实际退款）
 * - 查看退款历史
 * 
 * 使用场景：
 * - 管理员订单详情页面
 */

import React, { useEffect, useState } from 'react';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  RefreshCw,
  FileText,
  User
} from 'lucide-react';
import { 
  getRefundsByOrderId, 
  approveRefund, 
  rejectRefund,
  processRefund,
  Refund 
} from '@/services/refundService';
import RefundStatusBadge from '@/components/RefundStatusBadge';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface RefundManagementPanelProps {
  orderId: string;
  onRefundUpdate?: () => void;
}

export default function RefundManagementPanel({
  orderId,
  onRefundUpdate,
}: RefundManagementPanelProps) {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // 加载退款记录
  const loadRefunds = async () => {
    setLoading(true);
    try {
      const { refunds: data, error } = await getRefundsByOrderId(orderId);
      if (error) {
        toast.error('加载退款记录失败');
      } else {
        setRefunds(data || []);
      }
    } catch (error) {
      console.error('Failed to load refunds:', error);
      toast.error('加载退款记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRefunds();
  }, [orderId]);

  // 批准退款
  const handleApprove = async (refundId: string) => {
    if (!confirm('确认批准此退款申请吗？')) return;

    setProcessingId(refundId);
    try {
      const { success, error } = await approveRefund(refundId);
      if (success) {
        toast.success('退款申请已批准');
        loadRefunds();
        onRefundUpdate?.();
      } else {
        toast.error(error || '批准退款失败');
      }
    } catch (error) {
      toast.error('批准退款失败');
    } finally {
      setProcessingId(null);
    }
  };

  // 拒绝退款
  const handleReject = async (refundId: string) => {
    const reason = prompt('请输入拒绝原因：');
    if (!reason?.trim()) return;

    setProcessingId(refundId);
    try {
      const { success, error } = await rejectRefund(refundId, reason);
      if (success) {
        toast.success('退款申请已拒绝');
        loadRefunds();
        onRefundUpdate?.();
      } else {
        toast.error(error || '拒绝退款失败');
      }
    } catch (error) {
      toast.error('拒绝退款失败');
    } finally {
      setProcessingId(null);
    }
  };

  // 处理退款
  const handleProcess = async (refundId: string) => {
    if (!confirm('确认执行此退款操作吗？此操作不可撤销。')) return;

    setProcessingId(refundId);
    try {
      const { success, error } = await processRefund(refundId);
      if (success) {
        toast.success('退款处理成功');
        loadRefunds();
        onRefundUpdate?.();
      } else {
        toast.error(error || '退款处理失败');
      }
    } catch (error) {
      toast.error('退款处理失败');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (refunds.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
        <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">暂无退款记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">退款记录</h3>

      <div className="space-y-3">
        {refunds.map((refund) => (
          <div
            key={refund.id}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            {/* 退款头部信息 */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <RefundStatusBadge status={refund.status} />
                  <span className="text-sm text-gray-500">
                    {refund.refund_type === 'full' ? '全额退款' : '部分退款'}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  RM {(refund.refund_amount ?? refund.amount ?? 0).toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">
                  原金额：RM {(refund.original_amount ?? refund.amount ?? 0).toFixed(2)}
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2">
                {refund.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(refund.id)}
                      disabled={processingId === refund.id}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleReject(refund.id)}
                      disabled={processingId === refund.id}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </>
                )}

                {refund.status === 'approved' && (
                  <button
                    onClick={() => handleProcess(refund.id)}
                    disabled={processingId === refund.id}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${processingId === refund.id ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>
            </div>

            {/* 退款详情 */}
            <div className="mt-4 space-y-2 border-t pt-4">
              {/* 退款原因 */}
              <div className="flex gap-2">
                <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500">退款原因</p>
                  <p className="mt-1 text-sm text-gray-900">{refund.reason}</p>
                </div>
              </div>

              {/* 管理员备注 */}
              {refund.admin_notes && (
                <div className="flex gap-2">
                  <User className="h-4 w-4 shrink-0 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500">管理员备注</p>
                    <p className="mt-1 text-sm text-gray-700">{refund.admin_notes}</p>
                  </div>
                </div>
              )}

              {/* 失败原因 */}
              {refund.failed_reason && (
                <div className="flex gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-red-500">失败原因</p>
                    <p className="mt-1 text-sm text-red-700">{refund.failed_reason}</p>
                  </div>
                </div>
              )}

              {/* 时间线 */}
              <div className="flex gap-2">
                <Clock className="h-4 w-4 shrink-0 text-gray-400" />
                <div className="flex-1 space-y-1 text-xs text-gray-600">
                  <p>
                    创建于 {refund.created_at ? formatDistanceToNow(new Date(refund.created_at), { 
                      addSuffix: true, 
                      locale: zhCN 
                    }) : '-'}
                  </p>
                  {refund.approved_at && (
                    <p>
                      批准于 {formatDistanceToNow(new Date(refund.approved_at), { 
                        addSuffix: true, 
                        locale: zhCN 
                      })}
                    </p>
                  )}
                  {refund.completed_at && (
                    <p>
                      完成于 {formatDistanceToNow(new Date(refund.completed_at), { 
                        addSuffix: true, 
                        locale: zhCN 
                      })}
                    </p>
                  )}
                </div>
              </div>

              {/* 交易 ID */}
              {refund.transaction_id && (
                <div className="text-xs text-gray-500">
                  交易 ID: {refund.transaction_id}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
