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
      // Fetch dashboard stats from API
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      
      setStats({
        todayOrders: Number(data.totalOrders) || 0,
        todayRevenue: Number(data.totalRevenue) || 0,
        monthOrders: Number(data.totalOrders) || 0,
        monthRevenue: Number(data.totalRevenue) || 0,
        activePackages: 0,
        lowStockItems: Number(data.lowStockCount) || 0,
        pendingOrders: Number(data.pendingOrders) || 0,
      });

      setRecentOrders([]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }

    setLoading(false);
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
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      in_progress: 'bg-purple-100 text-purple-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏸</span>
              <div>
                <h1 className="text-xl font-bold text-gray-900">管理员仪表板</h1>
                <p className="text-sm text-gray-600">欢迎回来, {admin?.name || admin?.email}</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/api/auth/signout')}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
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
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">今日订单</span>
              <span className="text-2xl">📋</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.todayOrders}</div>
            <div className="text-sm text-gray-500">营业额: RM {stats.todayRevenue.toFixed(2)}</div>
          </div>

          {/* Month Orders */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">本月订单</span>
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.monthOrders}</div>
            <div className="text-sm text-gray-500">营业额: RM {stats.monthRevenue.toFixed(2)}</div>
          </div>

          {/* Pending Orders */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">待处理订单</span>
              <span className="text-2xl">⏳</span>
            </div>
            <div className="text-3xl font-bold text-orange-600 mb-1">{stats.pendingOrders}</div>
            <div className="text-sm text-gray-500">需要处理</div>
          </div>

          {/* Low Stock */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">低库存提醒</span>
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="text-3xl font-bold text-red-600 mb-1">{stats.lowStockItems}</div>
            <div className="text-sm text-gray-500">需要补货</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <button
              onClick={() => router.push('/admin/orders')}
              className="p-4 border-2 border-purple-200 rounded-xl hover:bg-purple-50 transition-colors"
            >
              <div className="text-3xl mb-2">📦</div>
              <div className="text-sm font-medium text-gray-900">订单管理</div>
            </button>
            <button
              onClick={() => router.push('/admin/inventory')}
              className="p-4 border-2 border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
            >
              <div className="text-3xl mb-2">📦</div>
              <div className="text-sm font-medium text-gray-900">库存管理</div>
            </button>
            <button
              onClick={() => router.push('/admin/packages')}
              className="p-4 border-2 border-green-200 rounded-xl hover:bg-green-50 transition-colors"
            >
              <div className="text-3xl mb-2">🎁</div>
              <div className="text-sm font-medium text-gray-900">套餐管理</div>
            </button>
            <button
              onClick={() => router.push('/admin/vouchers')}
              className="p-4 border-2 border-orange-200 rounded-xl hover:bg-orange-50 transition-colors"
            >
              <div className="text-3xl mb-2">🎫</div>
              <div className="text-sm font-medium text-gray-900">优惠券管理</div>
            </button>
            <button
              onClick={() => router.push('/admin/reports')}
              className="p-4 border-2 border-pink-200 rounded-xl hover:bg-pink-50 transition-colors"
            >
              <div className="text-3xl mb-2">📊</div>
              <div className="text-sm font-medium text-gray-900">营业报表</div>
            </button>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">最近订单</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentOrders.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-gray-500">暂无订单</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">{order.user_name}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{order.string_name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold text-gray-900">RM {order.total_price.toFixed(2)}</p>
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
