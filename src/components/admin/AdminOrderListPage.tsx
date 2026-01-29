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

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAllOrders, getOrderStats, searchOrders } from '@/services/adminOrderService';
import type { AdminOrder, OrderStatus, OrderStats } from '@/services/adminOrderService';
import { generateShortCode, formatDate } from '@/lib/utils';
import { Button, Input, Tabs } from '@/components';
import EmptyState from '@/components/EmptyState';
import { SkeletonTable } from '@/components/Skeleton';
import SectionLoading from '@/components/loading/SectionLoading';
import { Search, Inbox, Disc, Settings, CheckCircle } from 'lucide-react';

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

  const loadOrders = async (pageOverride?: number) => {
    setLoading(true);
    setError(null);

    const targetPage = pageOverride ?? currentPage;
    const filters: any = {
      page: targetPage,
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

  const handleSearch = async (pageOverride?: number) => {
    if (!searchTerm.trim()) {
      loadOrders();
      return;
    }

    setLoading(true);
    const targetPage = pageOverride ?? currentPage;
    const { orders: searchResults, total, error: searchError } = await searchOrders(searchTerm, {
      page: targetPage,
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

  const filterTabs = useMemo(
    () =>
      filters.map((filter) => ({
        id: filter.status,
        label:
          filter.count !== undefined
            ? `${filter.label} (${filter.count})`
            : filter.label,
      })),
    [filters]
  );

  return (
    <div className="min-h-screen bg-ink">
      {/* Header */}
      <div className="bg-white/90 border-b border-border-subtle sticky top-0 z-10 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary font-display">订单管理</h1>
              <p className="text-sm text-text-secondary mt-1">管理所有客户订单</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push('/admin/dashboard')}
              >
                返回仪表板
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setCurrentPage(1);
                  handleSearch(1);
                }
              }}
              placeholder="搜索订单（用户名、邮箱、订单ID）"
              leftIcon={<Search className="h-4 w-4" />}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setCurrentPage(1);
                  handleSearch(1);
                }}
              >
                搜索
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                  loadOrders(1);
                }}
              >
                清除
              </Button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mt-4 overflow-x-auto">
            <Tabs
              tabs={filterTabs}
              activeTab={filterStatus}
              onChange={(tabId) => {
                setFilterStatus(tabId as FilterStatus);
                setCurrentPage(1);
                setSearchTerm('');
              }}
              className="min-w-max"
            />
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="bg-ink-surface border-b border-border-subtle">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-text-secondary">今日订单</div>
                <div className="text-2xl font-bold text-text-primary font-mono">{stats.todayTotal ?? 0}</div>
              </div>
              <div>
                <div className="text-sm text-text-secondary">今日营业额</div>
                <div className="text-2xl font-bold text-accent font-mono">
                  RM {(stats.todayRevenue ?? 0).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-text-secondary">总订单</div>
                <div className="text-2xl font-bold text-text-primary font-mono">{stats.total}</div>
              </div>
              <div>
                <div className="text-sm text-text-secondary">待处理</div>
                <div className="text-2xl font-bold text-warning font-mono">
                  {stats.pending + stats.confirmed + (stats.in_progress ?? 0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order List */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <SkeletonTable rows={10} columns={6} />
        ) : error ? (
          <div className="bg-danger/15 border border-danger/40 rounded-lg p-4 text-center">
            <p className="text-danger">{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            type="no-orders"
            title="暂无订单"
            description={searchTerm || filterStatus !== 'all' ? '没有找到符合条件的订单' : '还没有收到任何订单'}
          />
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
                      <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
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
                        className="hover:bg-ink transition-colors cursor-pointer"
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
                          {/* 多球拍订单显示 */}
                          {(order as any).items?.length > 0 ? (
                            <>
                              <div className="text-sm text-accent font-medium flex items-center gap-1">
                                <Disc className="w-4 h-4" /> 多球拍订单
                              </div>
                              <div className="text-xs text-text-tertiary">
                                {(order as any).items.length} 支球拍
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-sm text-text-primary">
                                {order.string?.model ||
                                  order.string?.name ||
                                  order.stringInventory?.model ||
                                  '-'}
                              </div>
                              <div className="text-xs text-text-tertiary">
                                {order.string?.brand || order.stringInventory?.brand || '-'}
                              </div>
                            </>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
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
                                className="px-2.5 py-1 text-xs bg-info-soft text-info rounded-md hover:bg-info/20 transition-colors flex items-center gap-1"
                                title="开始穿线"
                              >
                                <Settings className="w-3 h-3" /> 开始
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
                                className="px-2.5 py-1 text-xs bg-success/15 text-success rounded-md hover:bg-success/25 transition-colors flex items-center gap-1"
                                title="完成订单"
                              >
                                <CheckCircle className="w-3 h-3" /> 完成
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
                    className="px-4 py-2 border border-border-subtle rounded-lg text-sm font-medium text-text-secondary hover:bg-ink disabled:opacity-50 disabled:cursor-not-allowed"
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
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum
                            ? 'bg-accent text-text-onAccent'
                            : 'text-text-secondary hover:bg-ink'
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
                    className="px-4 py-2 border border-border-subtle rounded-lg text-sm font-medium text-text-secondary hover:bg-ink disabled:opacity-50 disabled:cursor-not-allowed"
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
