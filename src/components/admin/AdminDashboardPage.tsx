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

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Badge, Button, Card, StatsCard } from '@/components';
import { DashboardSkeleton } from '@/components/skeletons';
import LowStockAlert from '@/components/admin/LowStockAlert';
import RestockModal from '@/components/admin/RestockModal';
import { AlertTriangle, BarChart3, Boxes, ClipboardList, Clock, LayoutDashboard, Package, Tag, Wallet } from 'lucide-react';
import { getDashboardStats } from '@/services/adminStatsService';

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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const quickActions = useMemo(
    () => [
      {
        label: '订单管理',
        description: '查看并处理订单',
        href: '/admin/orders',
        icon: <ClipboardList className="h-5 w-5" />,
      },
      {
        label: '库存管理',
        description: '查看库存与补货',
        href: '/admin/inventory',
        icon: <Boxes className="h-5 w-5" />,
      },
      {
        label: '套餐管理',
        description: '配置套餐与价格',
        href: '/admin/packages',
        icon: <Package className="h-5 w-5" />,
      },
      {
        label: '优惠券管理',
        description: '发布与维护优惠',
        href: '/admin/vouchers',
        icon: <Tag className="h-5 w-5" />,
      },
      {
        label: '报表分析',
        description: '查看经营数据',
        href: '/admin/reports',
        icon: <BarChart3 className="h-5 w-5" />,
      },
    ],
    []
  );

  useEffect(() => {
    if (!authLoading && admin) {
      loadDashboardData();
    }
  }, [admin, authLoading]);

  const loadDashboardData = async (skipCache = false) => {
    setLoading(true);

    try {
      const data = await getDashboardStats(5, { skipCache });
      if (data?.stats) {
        setStats({
          todayOrders: Number(data.stats.todayOrders) || 0,
          todayRevenue: Number(data.stats.todayRevenue) || 0,
          monthOrders: Number(data.stats.monthOrders) || 0,
          monthRevenue: Number(data.stats.monthRevenue) || 0,
          activePackages: Number(data.stats.activePackages) || 0,
          lowStockItems: Number(data.stats.lowStockItems) || 0,
          pendingOrders: Number(data.stats.pendingOrders) || 0,
        });
        setLastUpdated(new Date());
      }

      if (data?.recentOrders) {
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
    loadDashboardData(true);
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

  const getStatusVariant = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
      pending: 'warning',
      confirmed: 'info',
      in_progress: 'info',
      completed: 'success',
      cancelled: 'error',
    };
    return variants[status] || 'neutral';
  };

  if (authLoading || loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-ink">
      {/* Top Navigation */}
      <div className="bg-ink-surface border-b border-border-subtle sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-accent-soft text-accent flex items-center justify-center">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary">管理员仪表板</h1>
                <p className="text-sm text-text-secondary">欢迎回来, {admin?.name || admin?.email}</p>
                <p className="text-xs text-text-tertiary mt-1">
                  {lastUpdated ? `数据更新时间：${lastUpdated.toLocaleString('zh-CN')}` : '数据尚未更新'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => loadDashboardData(true)}
              >
                刷新数据
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/api/auth/signout')}
              >
                登出
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* 低库存预警 */}
        <LowStockAlert threshold={3} onRestockClick={handleRestockClick} />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <StatsCard
            title="今日订单"
            value={stats.todayOrders}
            icon={<ClipboardList className="h-5 w-5" />}
          />
          <StatsCard
            title="今日营收"
            value={`RM ${stats.todayRevenue.toFixed(2)}`}
            icon={<Wallet className="h-5 w-5" />}
          />
          <StatsCard
            title="本月订单"
            value={stats.monthOrders}
            icon={<BarChart3 className="h-5 w-5" />}
          />
          <StatsCard
            title="本月营收"
            value={`RM ${stats.monthRevenue.toFixed(2)}`}
            icon={<Wallet className="h-5 w-5" />}
          />
          <StatsCard
            title="待处理订单"
            value={stats.pendingOrders}
            icon={<Clock className="h-5 w-5 text-warning" />}
            className="border-warning/30"
          />
          <StatsCard
            title="低库存提醒"
            value={stats.lowStockItems}
            icon={<AlertTriangle className="h-5 w-5 text-danger" />}
            className="border-danger/30"
          />
        </div>

        {/* Quick Actions */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">快速操作</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/orders')}
            >
              查看全部订单
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            {quickActions.map((action) => (
              <Card
                key={action.href}
                padding="sm"
                onClick={() => router.push(action.href)}
                className="flex items-center gap-3 hover:bg-ink/70"
              >
                <div className="h-10 w-10 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
                  {action.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-text-primary">{action.label}</div>
                  <div className="text-xs text-text-tertiary truncate">{action.description}</div>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Recent Orders */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">最近订单</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/orders')}
            >
              查看全部
            </Button>
          </div>
          <div className="divide-y divide-border-subtle">
            {recentOrders.length === 0 ? (
              <div className="py-10 text-center text-text-tertiary">
                <p>暂无订单</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <button
                  key={order.id}
                  className="w-full text-left px-2 py-3 rounded-lg hover:bg-ink transition-colors"
                  onClick={() => router.push(`/admin/orders/${order.id}`)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-text-primary truncate">{order.user_name}</p>
                        <Badge variant={getStatusVariant(order.status)} size="sm">
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-text-secondary truncate">{order.string_name}</p>
                      <p className="text-xs text-text-tertiary">
                        {new Date(order.created_at).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-text-primary font-mono">
                        RM {order.total_price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>
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
