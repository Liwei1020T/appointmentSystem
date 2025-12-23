/**
 * 我的评价页面 (My Reviews Page)
 * 
 * 显示用户已提交的评价和待评价订单
 * 设计风格与订单列表页保持一致
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserReviews, getPendingReviewOrders, OrderReview, PendingReviewOrder } from '@/services/reviewService';
import ReviewCard from '@/components/ReviewCard';
import Spinner from '@/components/Spinner';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Star, MessageSquare, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

type TabType = 'submitted' | 'pending';

export default function MyReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<OrderReview[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingReviewOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('submitted');

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [reviewsList, pendingList] = await Promise.all([
        getUserReviews(''),
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

  // 标签选项（与订单页面筛选按钮风格一致）
  const tabFilters: { value: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { value: 'submitted', label: '已提交', icon: <MessageSquare className="w-4 h-4" />, count: reviews.length },
    { value: 'pending', label: '待评价', icon: <Clock className="w-4 h-4" />, count: pendingOrders.length },
  ];

  return (
    <div className="min-h-screen bg-ink">
      {/* 顶部导航 - 与订单页面一致 */}
      <div className="bg-ink-surface border-b border-border-subtle sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-lg font-semibold text-text-primary">我的评价</h1>
        </div>
      </div>

      {/* 内容区 */}
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* 标签筛选 - 与订单页面筛选按钮风格一致 */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabFilters.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${activeTab === tab.value
                  ? 'bg-accent text-text-onAccent'
                  : 'bg-ink-elevated text-text-secondary hover:bg-ink-surface'
                }`}
            >
              {tab.icon}
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {/* 错误提示 */}
        {error && !loading && (
          <Card className="p-6 text-center">
            <p className="text-danger mb-4">{error}</p>
            <Button onClick={loadData}>重试</Button>
          </Card>
        )}

        {/* 已提交评价 */}
        {!loading && !error && activeTab === 'submitted' && (
          <>
            {reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} showOrder />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <div className="text-text-tertiary mb-4">
                  <Star className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">暂无评价</h3>
                <p className="text-text-secondary mb-6">
                  完成订单后，您可以对服务进行评价
                </p>
                <Button onClick={() => router.push('/orders')}>查看订单</Button>
              </Card>
            )}
          </>
        )}

        {/* 待评价订单 */}
        {!loading && !error && activeTab === 'pending' && (
          <>
            {pendingOrders.length > 0 ? (
              <div className="space-y-3">
                {pendingOrders.map((order) => (
                  <Link key={order.id} href={`/orders/${order.id}?review=true`}>
                    <Card className="p-4 hover:bg-ink-elevated/80 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">⭐</span>
                            <h3 className="font-semibold text-text-primary">
                              {order.string ? `${order.string.brand} ${order.string.model}` : '穿线订单'}
                            </h3>
                          </div>
                          <p className="text-sm text-text-tertiary">
                            {formatDate(order.created_at)} · 拉力 {order.tension}磅
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-warning px-2 py-1 bg-warning/10 rounded-full">
                            待评价
                          </span>
                          <ChevronRight className="w-5 h-5 text-text-tertiary" />
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <div className="text-text-tertiary mb-4">
                  <Clock className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">暂无待评价订单</h3>
                <p className="text-text-secondary mb-6">
                  订单完成后会在这里显示待评价项目
                </p>
                <Button variant="secondary" onClick={() => router.push('/orders')}>
                  查看所有订单
                </Button>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
