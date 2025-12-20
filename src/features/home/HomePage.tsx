/**
 * 用户首页 (User Home Page)
 * 
 * 功能：
 * - 欢迎信息和用户资料快捷入口
 * - 显示当前积分和统计数据
 * - 快捷操作（预约、订单、套餐、优惠券）
 * - 精选套餐推荐
 * - 最近订单列表
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Spinner, Button, Badge } from '@/components';
import FeaturedReviews from '@/components/FeaturedReviews';
import QuickActions from './QuickActions';
import RecentOrders from './RecentOrders';
import PackageSummary from './PackageSummary';
import { useSession } from 'next-auth/react';
import { getUserStats, getRecentOrders, getFeaturedPackages, UserStats, RecentOrder, FeaturedPackage } from '@/services/homeService';

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAuthenticated = !!session;
  const loading = status === 'loading';

  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [featuredPackages, setFeaturedPackages] = useState<FeaturedPackage[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  /**
   * 如果未登录，跳转到登录页
   */
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  /**
   * 加载首页数据
   */
  useEffect(() => {
    if (user) {
      loadHomeData();
    }
  }, [user]);

  const loadHomeData = async () => {
    if (!user) return;

    setDataLoading(true);
    try {
      const [statsResult, ordersResult, packagesResult] = await Promise.all([
        getUserStats(user.id),
        getRecentOrders(user.id, 3),
        getFeaturedPackages(3),
      ]);

      if (statsResult) setStats(statsResult);
      if (ordersResult) setRecentOrders(ordersResult);
      if (packagesResult) setFeaturedPackages(packagesResult);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '待处理', in_progress: '处理中', completed: '已完成', cancelled: '已取消',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-ink pb-24">
      {/* 顶部欢迎横幅 */}
      <div className="bg-ink-elevated border-b border-border-subtle">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2 text-text-primary tracking-tight">
                欢迎回来，{user.full_name || '用户'}！👋
              </h1>
              <p className="text-text-tertiary">准备好为您的球拍穿线了吗？</p>
            </div>
            <Link href="/profile">
              <div className="w-12 h-12 bg-ink-surface border border-border-subtle rounded-full flex items-center justify-center hover:bg-ink-elevated transition">
                <span className="text-text-primary font-bold text-xl">
                  {user.full_name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 快捷操作按钮 - 使用 QuickActions 组件 */}
        <QuickActions />

        {/* 我的套餐摘要 - 使用 PackageSummary 组件 */}
        <PackageSummary />

        {/* 最近订单 - 使用 RecentOrders 组件 */}
        <RecentOrders />

        {/* 用户统计数据 */}
        {stats && (
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="text-sm text-text-tertiary mb-1">活跃套餐</div>
              <div className="text-2xl font-bold text-accent font-mono">{stats.activePackages}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-text-tertiary mb-1">待处理订单</div>
              <div className="text-2xl font-bold text-warning font-mono">{stats.pendingOrders}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-text-tertiary mb-1">总订单数</div>
              <div className="text-2xl font-bold text-text-primary font-mono">{stats.totalOrders}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-text-tertiary mb-1">当前积分</div>
              <div className="text-2xl font-bold text-success font-mono">{stats.points}</div>
            </Card>
          </div>
        )}

        {/* 精选评价 */}
        <FeaturedReviews />

        {/* 精选套餐 */}
        {featuredPackages.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text-primary">精选套餐</h2>
              <Link href="/packages" className="text-accent text-sm font-medium hover:text-text-primary">
                查看全部 →
              </Link>
            </div>
            <div className="space-y-4">
              {featuredPackages.map(pkg => (
                <Card key={pkg.id} className="p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-text-primary mb-1">{pkg.name}</h3>
                      <p className="text-sm text-text-secondary mb-2">{pkg.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-text-tertiary">{pkg.sessions_included} 次</span>
                        <span className="text-text-tertiary">{pkg.validity_days} 天有效</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-accent mb-1 font-mono">
                        RM {Number(pkg.price).toFixed(2)}
                      </div>
                      {(pkg.discount_percentage || 0) > 0 && (
                        <Badge variant="success" className="text-xs">
                          省 {pkg.discount_percentage}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Link href={`/packages/${pkg.id}`}>
                    <Button className="w-full mt-4">
                      购买套餐
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 帮助与支持 */}
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-3">需要帮助？</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-3 bg-ink-elevated hover:bg-ink-surface rounded-lg transition-colors text-sm text-text-secondary border border-border-subtle">
                📞 联系客服
              </button>
              <button className="w-full text-left px-4 py-3 bg-ink-elevated hover:bg-ink-surface rounded-lg transition-colors text-sm text-text-secondary border border-border-subtle">
                ❓ 常见问题
              </button>
              <button className="w-full text-left px-4 py-3 bg-ink-elevated hover:bg-ink-surface rounded-lg transition-colors text-sm text-text-secondary border border-border-subtle">
                📍 门店位置
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
