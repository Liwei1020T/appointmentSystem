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
import { Card, StatsCard, Spinner, Button, Badge } from '@/components';
import FeaturedReviews from '@/components/FeaturedReviews';
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* 顶部欢迎横幅 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                欢迎回来，{user.full_name || '用户'}！👋
              </h1>
              <p className="text-blue-100">准备好为您的球拍穿线了吗？</p>
            </div>
            <Link href="/profile">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition">
                <span className="text-white font-bold text-xl">
                  {user.full_name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 快捷操作卡片 */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/booking">
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition cursor-pointer border-2 border-blue-500">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">立即预约</h3>
                <p className="text-sm text-gray-500 mt-1">穿线服务</p>
              </div>
            </div>
          </Link>

          <Link href="/packages">
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition cursor-pointer">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">购买套餐</h3>
                <p className="text-sm text-gray-500 mt-1">更加优惠</p>
              </div>
            </div>
          </Link>

          <Link href="/vouchers">
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition cursor-pointer">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">我的优惠券</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {stats?.availableVouchers || 0} 张可用
                </p>
              </div>
            </div>
          </Link>

          <Link href="/profile">
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition cursor-pointer">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">我的积分</h3>
                <p className="text-sm text-gray-500 mt-1">{stats?.points || 0} 分</p>
              </div>
            </div>
          </Link>
        </div>

        {/* 用户统计数据 */}
        {stats && (
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="text-sm text-gray-600 mb-1">活跃套餐</div>
              <div className="text-2xl font-bold text-blue-600">{stats.activePackages}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-600 mb-1">待处理订单</div>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-600 mb-1">总订单数</div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalOrders}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-gray-600 mb-1">当前积分</div>
              <div className="text-2xl font-bold text-green-600">{stats.points}</div>
            </Card>
          </div>
        )}

        {/* 精选评价 */}
        <FeaturedReviews />

        {/* 精选套餐 */}
        {featuredPackages.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">精选套餐</h2>
              <Link href="/packages" className="text-blue-600 text-sm font-medium hover:text-blue-700">
                查看全部 →
              </Link>
            </div>
            <div className="space-y-4">
              {featuredPackages.map(pkg => (
                <Card key={pkg.id} className="p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{pkg.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{pkg.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600">{pkg.sessions_included} 次</span>
                        <span className="text-gray-600">{pkg.validity_days} 天有效</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        RM {Number(pkg.price).toFixed(2)}
                      </div>
                      {(pkg.discount_percentage || 0) > 0 && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          省 {pkg.discount_percentage}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Link href={`/packages/${pkg.id}`}>
                    <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                      购买套餐
                    </button>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 最近订单 */}
        {recentOrders.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">最近订单</h2>
              <Link href="/orders" className="text-blue-600 text-sm font-medium hover:text-blue-700">
                查看全部 →
              </Link>
            </div>
            <div className="space-y-3">
              {recentOrders.map(order => (
                <Card key={order.id} className="p-4 hover:shadow-md transition">
                  <Link href={`/orders/${order.id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {order.string_brand} {order.string_name}
                          </h3>
                          {order.use_package && (
                            <Badge className="bg-purple-100 text-purple-800 text-xs">套餐</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">拉力: {order.tension} 磅</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(order.created_at || order.createdAt || new Date()).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-bold text-gray-900 mb-2">RM {(order.price || order.final_price || order.finalPrice || 0).toFixed(2)}</div>
                        <Badge className={getStatusBadgeColor(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无订单</h3>
            <p className="text-gray-600 mb-4">开始您的第一次穿线服务预约吧</p>
            <Link href="/booking">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                立即预约
              </button>
            </Link>
          </Card>
        )}

        {/* 帮助与支持 */}
        <Card>
          <div className="p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">需要帮助？</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-sm text-slate-700">
                📞 联系客服
              </button>
              <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-sm text-slate-700">
                ❓ 常见问题
              </button>
              <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-sm text-slate-700">
                📍 门店位置
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* 底部导航栏（移动端） */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-area-pb md:hidden">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-around">
          <button className="flex flex-col items-center gap-1 text-blue-600">
            <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
            <span className="text-xs font-medium">首页</span>
          </button>
          
          <button
            onClick={() => router.push('/orders')}
            className="flex flex-col items-center gap-1 text-slate-600 hover:text-blue-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
            <span className="text-xs font-medium">订单</span>
          </button>
          
          <button
            onClick={() => router.push('/booking')}
            className="flex flex-col items-center gap-1 -mt-6"
          >
            <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 4v16m8-8H4"></path>
              </svg>
            </div>
            <span className="text-xs font-medium text-blue-600">预约</span>
          </button>
          
          <button
            onClick={() => router.push('/packages')}
            className="flex flex-col items-center gap-1 text-slate-600 hover:text-blue-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
            </svg>
            <span className="text-xs font-medium">套餐</span>
          </button>
          
          <button
            onClick={() => router.push('/profile')}
            className="flex flex-col items-center gap-1 text-slate-600 hover:text-blue-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            <span className="text-xs font-medium">我的</span>
          </button>
        </div>
      </div>
    </div>
 