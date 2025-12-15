'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  getPendingPayments,
  confirmPayment,
  rejectPayment,
} from '@/services/payment.service';
import { formatAmount } from '@/lib/payment-helpers';

interface Payment {
  id: string;
  amount: number;
  status: string;
  proofUrl: string | null;
  createdAt: Date;
  order: {
    id: string;
    user: {
      fullName: string;
      email: string;
      phone: string;
    };
    string: {
      brand: string;
      model: string;
    };
  };
}

export default function PaymentVerificationPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [processing, setProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [page]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await getPendingPayments(page, 10);
      setPayments(data.payments);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('获取支付列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (payment: Payment) => {
    if (!confirm(`确认支付 ${formatAmount(payment.amount)}？`)) return;

    setProcessing(true);
    try {
      await confirmPayment(payment.id);
      alert('支付已确认');
      fetchPayments();
      setSelectedPayment(null);
    } catch (error: any) {
      alert(error.message || '确认失败');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment) return;
    if (!rejectReason.trim()) {
      alert('请输入拒绝原因');
      return;
    }

    setProcessing(true);
    try {
      await rejectPayment(selectedPayment.id, rejectReason);
      alert('支付已拒绝');
      fetchPayments();
      setSelectedPayment(null);
      setShowRejectModal(false);
      setRejectReason('');
    } catch (error: any) {
      alert(error.message || '拒绝失败');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">支付审核</h1>
        <p className="text-gray-600 mt-2">
          待审核支付：{payments.length} 笔
        </p>
      </div>

      {payments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">暂无待审核的支付</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* 支付凭证预览 */}
              {payment.proofUrl && (
                <div className="relative h-48 bg-gray-100">
                  <Image
                    src={payment.proofUrl}
                    alt="Payment Proof"
                    fill
                    className="object-contain cursor-pointer"
                    onClick={() => setSelectedPayment(payment)}
                  />
                </div>
              )}

              <div className="p-4 space-y-3">
                {/* 金额 */}
                <div>
                  <p className="text-sm text-gray-600">支付金额</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatAmount(payment.amount)}
                  </p>
                </div>

                {/* 用户信息 */}
                <div>
                  <p className="text-sm text-gray-600">用户信息</p>
                  <p className="font-medium">{payment.order.user.fullName}</p>
                  <p className="text-sm text-gray-500">
                    {payment.order.user.email}
                  </p>
                  <p className="text-sm text-gray-500">
                    {payment.order.user.phone}
                  </p>
                </div>

                {/* 订单信息 */}
                <div>
                  <p className="text-sm text-gray-600">订单内容</p>
                  <p className="text-sm">
                    {payment.order.string.brand} {payment.order.string.model}
                  </p>
                  <p className="text-xs text-gray-500">
                    订单号: {payment.order.id.slice(0, 8)}
                  </p>
                </div>

                {/* 提交时间 */}
                <div>
                  <p className="text-xs text-gray-500">
                    提交时间:{' '}
                    {new Date(payment.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleConfirm(payment)}
                    disabled={processing}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                  >
                    确认
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPayment(payment);
                      setShowRejectModal(true);
                    }}
                    disabled={processing}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                  >
                    拒绝
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50"
          >
            上一页
          </button>
          <span className="px-4 py-2">
            第 {page} / {totalPages} 页
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}

      {/* 凭证预览模态框 */}
      {selectedPayment && !showRejectModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPayment(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">支付凭证详情</h2>

              {selectedPayment.proofUrl && (
                <div className="mb-6">
                  <Image
                    src={selectedPayment.proofUrl}
                    alt="Payment Proof"
                    width={800}
                    height={600}
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">支付金额</p>
                    <p className="text-xl font-bold">
                      {formatAmount(selectedPayment.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">订单号</p>
                    <p className="font-mono">
                      {selectedPayment.order.id.slice(0, 16)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => handleConfirm(selectedPayment)}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    确认支付
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    拒绝支付
                  </button>
                  <button
                    onClick={() => setSelectedPayment(null)}
                    className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    关闭
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 拒绝原因模态框 */}
      {showRejectModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">拒绝支付</h2>
            <p className="text-gray-600 mb-4">
              请输入拒绝原因，用户将收到通知
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="例如：支付金额不符、凭证不清晰等"
              className="w-full border rounded-lg p-3 min-h-[100px] mb-4"
            />
            <div className="flex gap-4">
              <button
                onClick={handleReject}
                disabled={processing || !rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
              >
                确认拒绝
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
