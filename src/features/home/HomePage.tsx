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
import { Card, Spinner, Button, Badge, SkeletonCard } from '@/components';
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
  const [isVisible, setIsVisible] = useState(false);

  // 页面进入动画
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

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
        getUserStats(),
        getRecentOrders(3),
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
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 顶部欢迎横幅 */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-xl mx-auto px-5 py-8">
          <div className="flex items-center justify-between">
            <div className="animate-fade-in">
              <h1 className="text-2xl font-bold mb-1 text-gray-900 tracking-tight">
                欢迎回来，{user.full_name || '用户'}！👋
              </h1>
              <p className="text-gray-500 text-sm">准备好为您的球拍穿线了吗？</p>
            </div>
            <Link href="/profile">
              <div className="w-12 h-12 gradient-accent rounded-full flex items-center justify-center hover:shadow-glow transition-shadow">
                <span className="text-white font-bold text-xl">
                  {user.full_name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* 主内容区 - 更大的垂直间距 */}
      <div className={`
        max-w-xl mx-auto px-5 py-8 space-y-8
        transition-all duration-700 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}>
        {/* 快捷操作按钮 */}
        <QuickActions />

        {/* 我的权益摘要 */}
        <PackageSummary />

        {/* 最近订单 */}
        <RecentOrders />

        {/* 精选评价 */}
        <FeaturedReviews />
      </div>
    </div>
  );
}
