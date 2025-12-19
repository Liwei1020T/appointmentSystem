/**
 * 管理员仪表板页面组件 (Admin Dashboard Page)
 * 
 * 功能：
 * - 显示关键业务指标（订单数、营业额、套餐销售、库存警告）
 * - 今日/本月统计对比
 * - 快速操作按钮
 * - 最近订单预览
 * - 营收趋势图表
 * - 库存警告
 * - 集成库存预警和补货功能
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import LowStockAlert from '@/components/admin/LowStockAlert';
import RestockModal from '@/components/admin/RestockModal';

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  monthOrders: number;
  monthRevenue: number;
  activePackages: number;
  lowStockItems: number;
  pendingOrders: number;
}

interface RecentOrder {
  id: string;
  user_name: string;
  string_name: string;
  total_price: number;
  status: string;
  created_at: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const authLoading = status === 'loading';
  const admin = session?.user;
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    todayRevenue: 0,
    monthOrders: 0,
    monthRevenue: 0,
    activePackages: 0,
    lowStockItems: 0,
    pendingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [selectedStringId, setSelectedStringId] = useState<string | undefined>();

  useEffect(() => {
    if (!authLoading && admin) {
      loadDashboardData();
    }
  }, [admin, authLoading]);

  const loadDashboardData = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/admin/dashboard-stats?limit=5');
      if (!response.ok) {
        throw new Error('Failed to load dashboard data');
      }
      const data = await response.json();

      if (data.stats) {
        setStats({
          todayOrders: Number(data.stats.todayOrders) || 0,
          todayRevenue: Number(data.stats.todayRevenue) || 0,
          monthOrders: Number(data.stats.monthOrders) || 0,
          monthRevenue: Number(data.stats.monthRevenue) || 0,
          activePackages: Number(data.stats.activePackages) || 0,
          lowStockItems: Number(data.stats.lowStockItems) || 0,
          pendingOrders: Number(data.stats.pendingOrders) || 0,
        });
      }

      if (data.recentOrders) {
        setRecentOrders(data.recentOrders);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理补货按钮点击
  const handleRestockClick = (stringId: string) => {
    setSelectedStringId(stringId);
    setRestockModalOpen(true);
  };

  // 补货成功后刷新数据
  const handleRestockSuccess = () => {
    loadDashboardData();
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-warning/15 text-warning',
      confirmed: 'bg-info-soft text-info',
      in_progress: 'bg-accent/15 text-accent',
      completed: 'bg-success/15 text-success',
      cancelled: 'bg-danger/15 text-danger',
    };
    return styles[status] || 'bg-ink-elevated text-text-secondary';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '待确认',
      confirmed: '已确认',
      in_progress: '处理中',
      completed: '已完成',
      cancelled: '已取消',
    };
    return labels[status] || status;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent mb-4"></div>
          <p className="text-text-secondary">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink">
      {/* Top Navigation */}
      <div className="bg-ink border-b border-border-subtle">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏸</span>
              <div>
                <h1 className="text-xl font-bold text-text-primary">管理员仪表板</h1>
                <p className="text-sm text-text-secondary">欢迎回来, {admin?.name || admin?.email}</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/api/auth/signout')}
              className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-ink-elevated rounded-lg transition-colors"
            >
              登出
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 max-w-7xl mx-auto">
        {/* 低库存预警 */}
        <LowStockAlert threshold={3} onRestockClick={handleRestockClick} />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Today Orders */}
          <div className="bg-ink-surface rounded-xl p-6 border border-border-subtle">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-secondary">今日订单</span>
              <span className="text-2xl">📋</span>
            </div>
            <div className="text-3xl font-bold text-text-primary mb-1">{stats.todayOrders}</div>
            <div className="text-sm text-text-tertiary">营业额: RM {stats.todayRevenue.toFixed(2)}</div>
          </div>

          {/* Month Orders */}
          <div className="bg-ink-surface rounded-xl p-6 border border-border-subtle">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-secondary">本月订单</span>
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-3xl font-bold text-text-primary mb-1">{stats.monthOrders}</div>
            <div className="text-sm text-text-tertiary">营业额: RM {stats.monthRevenue.toFixed(2)}</div>
          </div>

          {/* Pending Orders */}
          <div className="bg-ink-surface rounded-xl p-6 border border-border-subtle">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-secondary">待处理订单</span>
              <span className="text-2xl">⏳</span>
            </div>
            <div className="text-3xl font-bold text-warning mb-1">{stats.pendingOrders}</div>
            <div className="text-sm text-text-tertiary">需要处理</div>
          </div>

          {/* Low Stock */}
          <div className="bg-ink-surface rounded-xl p-6 border border-border-subtle">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-secondary">低库存提醒</span>
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="text-3xl font-bold text-danger mb-1">{stats.lowStockItems}</div>
            <div className="text-sm text-text-tertiary">需要补货</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-ink-surface rounded-xl p-6 border border-border-subtle mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4">快速操作</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <button
              onClick={() => router.push('/admin/orders')}
              className="p-4 border border-border-subtle rounded-xl hover:bg-ink-elevated transition-colors"
            >
              <div className="text-3xl mb-2">📦</div>
              <div className="text-sm font-medium text-text-primary">订单管理</div>
            </button>
            <button
              onClick={() => router.push('/admin/inventory')}
              className="p-4 border border-border-subtle rounded-xl hover:bg-ink-elevated transition-colors"
            >
              <div className="text-3xl mb-2">📦</div>
              <div className="text-sm font-medium text-text-primary">库存管理</div>
            </button>
            <button
              onClick={() => router.push('/admin/packages')}
              className="p-4 border border-border-subtle rounded-xl hover:bg-ink-elevated transition-colors"
            >
              <div className="text-3xl mb-2">🎁</div>
              <div className="text-sm font-medium text-text-primary">套餐管理</div>
            </button>
            <button
              onClick={() => router.push('/admin/vouchers')}
              className="p-4 border border-border-subtle rounded-xl hover:bg-ink-elevated transition-colors"
            >
              <div className="text-3xl mb-2">🎫</div>
              <div className="text-sm font-medium text-text-primary">优惠券管理</div>
            </button>
            <button
              onClick={() => router.push('/admin/reports')}
              className="p-4 border border-border-subtle rounded-xl hover:bg-ink-elevated transition-colors"
            >
              <div className="text-3xl mb-2">📊</div>
              <div className="text-sm font-medium text-text-primary">营业报表</div>
            </button>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-ink-surface rounded-xl border border-border-subtle">
          <div className="p-6 border-b border-border-subtle">
            <h2 className="text-lg font-semibold text-text-primary">最近订单</h2>
          </div>
          <div className="divide-y divide-border-subtle">
            {recentOrders.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-text-tertiary">暂无订单</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="p-4 hover:bg-ink-elevated transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-text-primary">{order.user_name}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary">{order.string_name}</p>
                      <p className="text-xs text-text-tertiary">
                        {new Date(order.created_at).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold text-text-primary">RM {order.total_price.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 补货模态框 */}
      <RestockModal
        isOpen={restockModalOpen}
        onClose={() => {
          setRestockModalOpen(false);
          setSelectedStringId(undefined);
        }}
        onSuccess={handleRestockSuccess}
        preselectedStringId={selectedStringId}
      />
    </div>
  );
}
