/**
 * 用户退款信息组件
 * 
 * 用途：
 * - 显示订单的退款信息
 * - 退款状态展示
 * - 退款进度跟踪
 * 
 * 使用场景：
 * - 用户订单详情页面
 */

import React, { useEffect, useState } from 'react';
import { DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { getRefundsByOrderId, Refund } from '@/services/refundService';
import RefundStatusBadge from '@/components/RefundStatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface UserRefundInfoProps {
  orderId: string;
}

export default function UserRefundInfo({ orderId }: UserRefundInfoProps) {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRefunds();
  }, [orderId]);

  const loadRefunds = async () => {
    setLoading(true);
    try {
      const { refunds: data } = await getRefundsByOrderId(orderId);
      setRefunds(data || []);
    } catch (error) {
      console.error('Failed to load refunds:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (refunds.length === 0) {
    return null;
  }

  // 显示最新的退款记录
  const latestRefund = refunds[0];

  return (
    <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      {/* 退款头部 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">退款信息</h3>
        </div>
        <RefundStatusBadge status={latestRefund.status} size="sm" />
      </div>

      {/* 退款金额 */}
      <div className="mb-3">
        <div className="text-sm text-gray-600">退款金额</div>
        <div className="text-2xl font-bold text-gray-900">
          RM {(latestRefund.refund_amount || latestRefund.refundAmount || 0).toFixed(2)}
        </div>
        {latestRefund.refund_type === 'partial' && (
          <div className="text-xs text-gray-500">
            原金额：RM {(latestRefund.original_amount || latestRefund.originalAmount || 0).toFixed(2)}（部分退款）
          </div>
        )}
      </div>

      {/* 退款原因 */}
      <div className="mb-3 rounded-lg bg-white p-3">
        <div className="mb-1 text-xs font-medium text-gray-500">退款原因</div>
        <div className="text-sm text-gray-900">{latestRefund.reason}</div>
      </div>

      {/* 退款状态说明 */}
      <div className="space-y-2 text-sm">
        {latestRefund.status === 'pending' && (
          <div className="flex gap-2 rounded-lg bg-yellow-50 p-2">
            <Clock className="h-4 w-4 shrink-0 text-yellow-600" />
            <div className="text-yellow-800">
              <p className="font-medium">退款申请待处理</p>
              <p className="text-xs text-yellow-700">
                管理员正在审核您的退款申请，请耐心等待
              </p>
            </div>
          </div>
        )}

        {latestRefund.status === 'approved' && (
          <div className="flex gap-2 rounded-lg bg-blue-50 p-2">
            <CheckCircle className="h-4 w-4 shrink-0 text-blue-600" />
            <div className="text-blue-800">
              <p className="font-medium">退款已批准</p>
              <p className="text-xs text-blue-700">
                退款申请已批准，正在处理退款流程
              </p>
            </div>
          </div>
        )}

        {latestRefund.status === 'processing' && (
          <div className="flex gap-2 rounded-lg bg-purple-50 p-2">
            <div className="h-4 w-4 shrink-0">
              <div className="h-full w-full animate-spin rounded-full border-2 border-purple-600 border-t-transparent"></div>
            </div>
            <div className="text-purple-800">
              <p className="font-medium">退款处理中</p>
              <p className="text-xs text-purple-700">
                退款正在处理，预计 3-5 个工作日到账
              </p>
            </div>
          </div>
        )}

        {latestRefund.status === 'completed' && (
          <div className="flex gap-2 rounded-lg bg-green-50 p-2">
            <CheckCircle className="h-4 w-4 shrink-0 text-green-600" />
            <div className="text-green-800">
              <p className="font-medium">退款已完成</p>
              <p className="text-xs text-green-700">
                退款已成功退回到您的支付账户
              </p>
              {latestRefund.completed_at && (
                <p className="mt-1 text-xs text-green-600">
                  完成时间：
                  {formatDistanceToNow(new Date(latestRefund.completed_at), {
                    addSuffix: true,
                    locale: zhCN,
                  })}
                </p>
              )}
            </div>
          </div>
        )}

        {latestRefund.status === 'rejected' && (
          <div className="flex gap-2 rounded-lg bg-red-50 p-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <div className="text-red-800">
              <p className="font-medium">退款已拒绝</p>
              {latestRefund.failed_reason && (
                <p className="text-xs text-red-700">
                  原因：{latestRefund.failed_reason}
                </p>
              )}
            </div>
          </div>
        )}

        {latestRefund.status === 'failed' && (
          <div className="flex gap-2 rounded-lg bg-red-50 p-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <div className="text-red-800">
              <p className="font-medium">退款失败</p>
              {latestRefund.failed_reason && (
                <p className="text-xs text-red-700">
                  原因：{latestRefund.failed_reason}
                </p>
              )}
              <p className="mt-1 text-xs text-red-600">
                请联系客服处理
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 时间信息 */}
      <div className="mt-3 border-t border-gray-200 pt-2 text-xs text-gray-500">
        申请时间：
        {formatDistanceToNow(new Date(latestRefund.created_at || latestRefund.createdAt || new Date()), {
          addSuffix: true,
          locale: zhCN,
        })}
      </div>

      {/* 查看更多退款记录 */}
      {refunds.length > 1 && (
        <div className="mt-2 text-center">
          <button className="text-xs text-blue-600 hover:text-blue-700">
            查看全部 {refunds.length} 条退款记录
          </button>
        </div>
      )}
    </div>
  );
}
