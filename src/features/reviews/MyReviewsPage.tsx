/**
 * 我的评价页面 (My Reviews Page)
 * 
 * 显示用户所有评价历史
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserReviews, OrderReview } from '@/services/review.service';
import ReviewCard from '@/components/ReviewCard';
import Card from '@/components/Card';
import Spinner from '@/components/Spinner';
import Button from '@/components/Button';

export default function MyReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<OrderReview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // 加载评价列表
  const loadReviews = async () => {
    setLoading(true);
    setError('');

    try {
      // TODO: Get actual userId from session
      const userId = 'temp-user-id';
      const data = await getUserReviews(userId);
      setReviews(data || []);
    } catch (err: any) {
      setError(err?.message || '加载评价失败');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-slate-600 hover:text-slate-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-slate-900">我的评价</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* 错误提示 */}
        {error && (
          <Card className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadReviews}>重试</Button>
          </Card>
        )}

        {/* 评价列表 */}
        {!error && reviews.length > 0 && (
          <div className="space-y-3">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} showOrder />
            ))}
          </div>
        )}

        {/* 空状态 */}
        {!error && !loading && reviews.length === 0 && (
          <Card className="p-12 text-center">
            <div className="text-slate-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">暂无评价</h3>
            <p className="text-slate-600 mb-6">
              完成订单后，您可以对服务进行评价
            </p>
            <Button onClick={() => router.push('/orders')}>查看订单</Button>
          </Card>
        )}
      </div>
    </div>
  );
}
