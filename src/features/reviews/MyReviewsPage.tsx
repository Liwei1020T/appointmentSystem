/**
 * 我的评价页面 (My Reviews Page)
 * 
 * 显示用户已提交的评价和待评价订单
 * 设计风格：活力橙 + 玻璃拟态 + 呼吸感设计
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Clock, Star, ChevronRight, Sparkles } from 'lucide-react';
import { getUserReviews, getPendingReviewOrders, OrderReview, PendingReviewOrder } from '@/services/reviewService';
import ReviewCard from '@/components/ReviewCard';
import Spinner from '@/components/Spinner';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import PageHeader from '@/components/layout/PageHeader';

type TabType = 'submitted' | 'pending';

export default function MyReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<OrderReview[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingReviewOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('submitted');
  const [isVisible, setIsVisible] = useState(false);

  // 页面进入动画
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setIsVisible(true), 150);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [reviewsList, pendingList] = await Promise.all([
        getUserReviews(),
        getPendingReviewOrders(),
      ]);
      setReviews(Array.isArray(reviewsList) ? reviewsList : []);
      setPendingOrders(Array.isArray(pendingList) ? pendingList : []);
    } catch (err: any) {
      setError(err?.message || '加载评价失败');
      setReviews([]);
      setPendingOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 标签选项
  const tabFilters: { value: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { value: 'submitted', label: '已提交', icon: <MessageSquare className="w-4 h-4" />, count: reviews.length },
    { value: 'pending', label: '待评价', icon: <Clock className="w-4 h-4" />, count: pendingOrders.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="我的评价"
        subtitle="查看您的服务评价记录"
      />

      {/* 内容区 */}
      <div className={`
        max-w-2xl mx-auto p-4 space-y-5
        transition-all duration-700 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}>
        {/* 现代分段式标签栏 - Segmented Control Tabs */}
        <div className="bg-white rounded-xl p-1.5 shadow-sm border border-gray-100">
          <div className="flex gap-1">
            {tabFilters.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === tab.value
                  ? 'bg-orange-50 text-orange-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab.value
                  ? 'bg-orange-100 text-orange-600'
                  : 'bg-gray-100 text-gray-500'
                  }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        )}

        {/* 错误提示 */}
        {error && !loading && (
          <Card className="p-6 text-center bg-white border border-gray-100 shadow-sm">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={loadData}>重试</Button>
          </Card>
        )}

        {/* 已提交评价 */}
        {!loading && !error && activeTab === 'submitted' && (
          <>
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review, index) => (
                  <div
                    key={review.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <ReviewCard review={review} showOrder />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Star className="w-16 h-16" />}
                title="暂无评价"
                description="完成订单后，您可以对服务进行评价"
                actionLabel="查看订单"
                onAction={() => router.push('/orders')}
              />
            )}
          </>
        )}

        {/* 待评价订单 - 票据风格 */}
        {!loading && !error && activeTab === 'pending' && (
          <>
            {pendingOrders.length > 0 ? (
              <div className="space-y-4">
                {pendingOrders.map((order, index) => (
                  <PendingReviewTicket
                    key={order.id}
                    order={order}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Clock className="w-16 h-16" />}
                title="暂无待评价订单"
                description="订单完成后会在这里显示待评价项目"
                actionLabel="查看所有订单"
                onAction={() => router.push('/orders')}
                variant="secondary"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * 待评价票据卡片组件 - Ticket Style Card
 */
function PendingReviewTicket({ order, index }: { order: PendingReviewOrder; index: number }) {
  return (
    <Link href={`/orders/${order.id}?review=true`}>
      <div
        className="relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-fade-in group"
        style={{ animationDelay: `${index * 80}ms` }}
      >
        {/* 左侧缺口装饰 */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-6 bg-gray-50 rounded-r-full" />
        {/* 右侧缺口装饰 */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-6 bg-gray-50 rounded-l-full" />

        <div className="flex">
          {/* 左侧主内容区 */}
          <div className="flex-1 p-4 pr-3">
            <div className="flex items-start gap-3">
              {/* 图标容器 */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-sm flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              {/* 订单信息 */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {order.string ? `${order.string.brand} ${order.string.model}` : '穿线订单'}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {formatDate(order.created_at)} · 拉力 {order.tension}磅
                </p>
              </div>
            </div>
          </div>

          {/* 虚线分隔 */}
          <div className="w-px border-l border-dashed border-gray-200 my-3" />

          {/* 右侧操作区 */}
          <div className="flex flex-col items-center justify-center px-4 py-3 min-w-[90px]">
            <span className="text-xs text-orange-500 font-medium mb-1">待评价</span>
            <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
              <ChevronRight className="w-5 h-5 text-orange-500" />
            </div>
          </div>
        </div>

        {/* 底部渐变装饰条 */}
        <div className="h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400" />
      </div>
    </Link>
  );
}

/**
 * 空状态组件 - Empty State Component
 */
function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'primary',
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center animate-fade-in">
      <div className={`mx-auto mb-5 w-20 h-20 rounded-2xl flex items-center justify-center ${variant === 'primary'
        ? 'bg-gradient-to-br from-orange-50 to-orange-100 text-orange-400'
        : 'bg-gray-50 text-gray-400'
        }`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-xs mx-auto">{description}</p>
      <Button
        onClick={onAction}
        variant={variant === 'primary' ? 'primary' : 'secondary'}
        className={variant === 'primary' ? 'bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white shadow-md' : ''}
      >
        {actionLabel}
      </Button>
    </div>
  );
}
