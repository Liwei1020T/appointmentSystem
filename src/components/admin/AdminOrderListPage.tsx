/**
 * 管理员订单列表页面组件 (Admin Order List Page)
 * 
 * 功能：
 * - 订单列表展示
 * - 状态筛选（全部、待确认、已确认、处理中、已完成、已取消）
 * - 日期范围筛选
 * - 搜索功能（用户名、邮箱、订单ID）
 * - 分页
 * - 批量操作
 * - 状态更新
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAllOrders, getOrderStats, searchOrders } from '@/services/adminOrderService';
import type { AdminOrder, OrderStatus, OrderStats } from '@/services/adminOrderService';
import { generateShortCode, formatDate } from '@/lib/utils';

type FilterStatus = 'all' | OrderStatus;

export default function AdminOrderListPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    loadOrders();
    loadStats();
  }, [filterStatus, currentPage]);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);

    const filters: any = {
      page: currentPage,
      limit: pageSize,
    };

    if (filterStatus !== 'all') {
      filters.status = filterStatus;
    }

    const { orders: fetchedOrders, total, error: ordersError } = await getAllOrders(filters);

    if (ordersError) {
      setError(ordersError.message);
    } else {
      setOrders(fetchedOrders || []);
      setTotalOrders(total);
    }

    setLoading(false);
  };

  const loadStats = async () => {
    const { stats: fetchedStats } = await getOrderStats();
    setStats(fetchedStats);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadOrders();
      return;
    }

    setLoading(true);
    const { orders: searchResults, total, error: searchError } = await searchOrders(searchTerm, {
      page: currentPage,
      limit: pageSize,
      status: filterStatus !== 'all' ? filterStatus : undefined,
    });

    if (searchError) {
      setError(searchError.message);
    } else {
      setOrders(searchResults || []);
      setTotalOrders(total || searchResults?.length || 0);
    }

    setLoading(false);
  };

  const getStatusBadge = (status: OrderStatus) => {
    const styles: Record<OrderStatus, string> = {
      pending: 'bg-warning/15 text-warning border-warning/40',
      confirmed: 'bg-info-soft text-info border-info/40',
      processing: 'bg-info-soft text-info border-info/40',
      in_progress: 'bg-accent/15 text-accent border-accent/40',
      ready: 'bg-success/15 text-success border-success/40',
      completed: 'bg-success/15 text-success border-success/40',
      cancelled: 'bg-danger/15 text-danger border-danger/40',
    };
    return styles[status];
  };

  const getStatusLabel = (status: OrderStatus) => {
    const labels: Record<OrderStatus, string> = {
      pending: '待确认',
      confirmed: '已确认',
      processing: '处理中',
      in_progress: '处理中',
      ready: '已完成',
      completed: '已完成',
      cancelled: '已取消',
    };
    return labels[status];
  };

  const totalPages = Math.ceil(totalOrders / pageSize);

  const filters: { status: FilterStatus; label: string; count?: number }[] = [
    { status: 'all', label: '全部', count: stats?.total },
    { status: 'pending', label: '待确认', count: stats?.pending },
    { status: 'confirmed', label: '已确认', count: stats?.confirmed },
    { status: 'in_progress', label: '处理中', count: stats?.in_progress },
    { status: 'completed', label: '已完成', count: stats?.completed },
    { status: 'cancelled', label: '已取消', count: stats?.cancelled },
  ];

  return (
    <div className="min-h-screen bg-ink-elevated">
      {/* Header */}
      <div className="bg-ink-surface border-b shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">订单管理</h1>
              <p className="text-sm text-text-secondary mt-1">管理所有客户订单</p>
            </div>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-ink-elevated rounded-lg transition-colors"
            >
              返回仪表板
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索订单（用户名、邮箱、订单ID）"
              className="flex-1 px-4 py-2 border border-border-subtle bg-ink-elevated text-text-primary rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-accent text-text-onAccent rounded-lg hover:shadow-glow transition-colors"
            >
              搜索
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {filters.map((filter) => (
              <button
                key={filter.status}
                onClick={() => {
                  setFilterStatus(filter.status);
                  setCurrentPage(1);
                  setSearchTerm('');
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filterStatus === filter.status
                    ? 'bg-accent text-text-onAccent'
                    : 'bg-ink-elevated text-text-secondary hover:bg-ink-surface'
                }`}
              >
                {filter.label}
                {filter.count !== undefined && (
                  <span className="ml-2 opacity-75">({filter.count})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="bg-ink-surface border-b px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-text-secondary">今日订单</div>
              <div className="text-2xl font-bold text-text-primary">{stats.todayTotal ?? 0}</div>
            </div>
            <div>
              <div className="text-sm text-text-secondary">今日营业额</div>
              <div className="text-2xl font-bold text-accent">RM {(stats.todayRevenue ?? 0).toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-text-secondary">总订单</div>
              <div className="text-2xl font-bold text-text-primary">{stats.total}</div>
            </div>
            <div>
              <div className="text-sm text-text-secondary">待处理</div>
              <div className="text-2xl font-bold text-warning">{stats.pending + stats.confirmed + (stats.in_progress ?? 0)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Order List */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
            <p className="text-text-tertiary mt-4">加载中...</p>
          </div>
        ) : error ? (
          <div className="bg-danger/15 border border-danger/40 rounded-lg p-4 text-center">
            <p className="text-danger">{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-ink-surface rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-text-secondary mb-2">暂无订单</p>
            <p className="text-sm text-text-tertiary">没有找到符合条件的订单</p>
          </div>
        ) : (
          <>
            <div className="bg-ink-surface rounded-lg shadow-sm border border-border-subtle overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-ink-elevated border-b border-border-subtle">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        订单信息
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        客户
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        球线
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        金额
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-ink-elevated transition-colors cursor-pointer"
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-mono text-text-primary">
                            #{generateShortCode(order.id)}
                          </div>
                          <div className="text-xs text-text-tertiary">
                            {formatDate(order.created_at || order.createdAt, 'yyyy/MM/dd HH:mm:ss')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-text-primary">
                            {order.user?.full_name || order.user?.fullName || '-'}
                          </div>
                          <div className="text-xs text-text-tertiary">{order.user?.phone || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-text-primary">
                            {order.string?.model ||
                              order.string?.name ||
                              order.stringInventory?.model ||
                              '-'}
                          </div>
                          <div className="text-xs text-text-tertiary">
                            {order.string?.brand || order.stringInventory?.brand || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-text-primary">
                            {(() => {
                              const totalAmount = Number(
                                order.total_price ??
                                  order.totalAmount ??
                                  // prisma 订单价格字段
                                  (order as any).price ??
                                  (order as any).final_price ??
                                  0
                              );
                              return `RM ${totalAmount.toFixed(2)}`;
                            })()}
                          </div>
                          {(Number(order.voucher_discount ?? 0) > 0) && (
                            <div className="text-xs text-success">
                              {(() => {
                                const voucherDiscount = Number(order.voucher_discount ?? 0);
                                return `-RM ${voucherDiscount.toFixed(2)}`;
                              })()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                              order.status
                            )}`}
                          >
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {/* 快捷状态更新按钮 */}
                            {(order.status === 'pending' || order.status === 'confirmed') && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const { updateOrderStatus } = await import('@/services/adminOrderService');
                                  const { toast } = await import('sonner');
                                  const { order: updated, error } = await updateOrderStatus(
                                    order.id,
                                    'in_progress',
                                    '快捷操作：开始穿线'
                                  );
                                  if (error) {
                                    toast.error('更新失败');
                                  } else {
                                    toast.success('已开始穿线');
                                    loadOrders();
                                  }
                                }}
                                className="px-2 py-1 text-xs bg-info-soft text-info rounded hover:bg-info/20 transition-colors"
                                title="开始穿线"
                              >
                                ⚙️ 开始
                              </button>
                            )}
                            {(order.status === 'in_progress' || order.status === 'processing') && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const { completeOrder } = await import('@/services/completeOrderService');
                                  const { toast } = await import('sonner');
                                  const { data, error } = await completeOrder(order.id, '快捷操作：完成订单');
                                  if (error) {
                                    toast.error('完成失败');
                                  } else {
                                    toast.success('订单已完成');
                                    loadOrders();
                                  }
                                }}
                                className="px-2 py-1 text-xs bg-success/15 text-success rounded hover:bg-success/25 transition-colors"
                                title="完成订单"
                              >
                                ✓ 完成
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/admin/orders/${order.id}`);
                              }}
                              className="text-accent hover:text-accent/80 text-sm font-medium"
                            >
                              详情
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-text-secondary">
                  显示 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalOrders)} / 共 {totalOrders} 条
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-border-subtle rounded-lg text-sm font-medium text-text-secondary hover:bg-ink-elevated disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum = i + 1;
                      if (totalPages > 5) {
                        if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === pageNum
                              ? 'bg-accent text-text-onAccent'
                              : 'text-text-secondary hover:bg-ink-elevated'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-border-subtle rounded-lg text-sm font-medium text-text-secondary hover:bg-ink-elevated disabled:opacity-50 disabled:cursor-not-allowed"
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
