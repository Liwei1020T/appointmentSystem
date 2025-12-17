/**
 * 我的订单页面 (My Orders Page)
 * 
 * 显示用户所有订单，支持状态筛选、搜索和详情查看
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getUserOrders, OrderWithDetails } from '@/services/order.service';
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ChevronRight,
  Calendar,
  DollarSign,
} from 'lucide-react';

type OrderStatus = 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled';

export default function MyOrdersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAuthenticated = !!session;

  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadOrders();
  }, [isAuthenticated]);

  const loadOrders = async () => {
    setLoading(true);
    const { data, error } = await getUserOrders();

    if (!error && data) {
      setOrders(data);
      setFilteredOrders(data);
    }
    setLoading(false);
  };

  // 筛选订单
  useEffect(() => {
    let filtered = orders;

    // 按状态筛选
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((order) => order.status === selectedStatus);
    }

    // 按搜索关键词筛选
    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.string?.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.string?.model?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  }, [selectedStatus, searchQuery, orders]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: '待处理',
          color: 'bg-yellow-100 text-yellow-800',
          icon: <Clock className="w-4 h-4" />,
        };
      case 'in_progress':
        return {
          label: '处理中',
          color: 'bg-blue-100 text-blue-800',
          icon: <Package className="w-4 h-4" />,
        };
      case 'completed':
        return {
          label: '已完成',
          color: 'bg-green-100 text-green-800',
          icon: <CheckCircle2 className="w-4 h-4" />,
        };
      case 'cancelled':
        return {
          label: '已取消',
          color: 'bg-red-100 text-red-800',
          icon: <XCircle className="w-4 h-4" />,
        };
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-800',
          icon: <Package className="w-4 h-4" />,
        };
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'unpaid':
        return '未支付';
      case 'pending':
        return '待支付';
      case 'pending_verification':
        return '审核中';
      case 'paid':
        return '已支付';
      case 'verifying':
        return '审核中';
      case 'failed':
        return '支付失败';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">我的订单</h1>
          <p className="text-gray-600">查看和管理您的所有订单</p>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="搜索订单号、球线品牌或型号..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* 状态筛选 */}
            <div className="flex gap-2 overflow-x-auto">
              {[
                { value: 'all', label: '全部' },
                { value: 'pending', label: '待处理' },
                { value: 'in_progress', label: '处理中' },
                { value: 'completed', label: '已完成' },
                { value: 'cancelled', label: '已取消' },
              ].map((status) => (
                <button
                  key={status.value}
                  onClick={() => setSelectedStatus(status.value as OrderStatus)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedStatus === status.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* 统计信息 */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                <p className="text-sm text-gray-600">总订单</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {orders.filter((o) => o.status === 'pending').length}
                </p>
                <p className="text-sm text-gray-600">待处理</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {orders.filter((o) => o.status === 'in_progress').length}
                </p>
                <p className="text-sm text-gray-600">处理中</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {orders.filter((o) => o.status === 'completed').length}
                </p>
                <p className="text-sm text-gray-600">已完成</p>
              </div>
            </div>
          </div>
        </div>

        {/* 订单列表 */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无订单</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || selectedStatus !== 'all'
                ? '没有找到符合条件的订单'
                : '您还没有任何订单'}
            </p>
            <button
              onClick={() => router.push('/booking')}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              立即预约
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const finalAmount = order.final_price ?? order.price;
              const paymentStatus = order.payment_status || 'unpaid';
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    {/* 订单头部 */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <div className="flex items-center gap-3 mb-2 md:mb-0">
                        <span className="text-lg font-semibold text-gray-900">
                          {order.id}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}
                        >
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {order.created_at || order.createdAt ? formatDate((order.created_at || order.createdAt)!.toString()) : '未知'}
                      </div>
                    </div>

                    {/* 订单内容 */}
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">球线信息</p>
                        <p className="font-medium text-gray-900">
                          {order.string?.brand} {order.string?.model}
                        </p>
                        {order.string?.specification && (
                          <p className="text-sm text-gray-600">
                            {order.string.specification}
                          </p>
                        )}
                        {order.tension && (
                          <p className="text-sm text-gray-600">拉力: {order.tension} lbs</p>
                        )}
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 mb-1">支付信息</p>
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="w-4 h-4 text-gray-600" />
                          <span className="text-xl font-bold text-gray-900">
                            RM {Number(finalAmount).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          支付状态: {getPaymentStatusLabel(paymentStatus)}
                        </p>
                      </div>
                    </div>

                    {/* 备注 */}
                    {order.notes && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">备注</p>
                        <p className="text-sm text-gray-900">{order.notes}</p>
                      </div>
                    )}

                    {/* 操作按钮 */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => router.push(`/orders/${order.id}`)}
                        className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg font-medium transition-colors"
                      >
                        查看详情
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
