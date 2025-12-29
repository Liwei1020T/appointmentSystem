/**
 * 全部评价页面 (All Reviews Page)
 *
 * 展示平台公开评价列表，支持点击查看完整内容。
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Star } from 'lucide-react';
import { Card } from '@/components';
import PageHeader from '@/components/layout/PageHeader';
import StarRating from '@/components/StarRating';
import { formatDate } from '@/lib/utils';
import { getPublicReviews, type OrderReview } from '@/services/reviewService';

export default function AllReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<OrderReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      const data = await getPublicReviews();
      setReviews(Array.isArray(data) ? data : []);
      setLoading(false);
    };
    loadReviews();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="用户评价" subtitle="查看全部用户评价" onBack={() => router.push('/')} />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Star className="w-4 h-4 text-amber-400" />
          <span>共 {reviews.length} 条公开评价</span>
        </div>

        {loading ? (
          <Card className="p-6">
            <p className="text-sm text-gray-500">正在加载评价...</p>
          </Card>
        ) : reviews.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-gray-500">暂无公开评价</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Link key={review.id} href={`/reviews/all/${review.id}`} className="block">
                <Card className="p-4 hover:shadow-md transition-all border border-gray-100">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <StarRating value={Number(review.rating) || 0} readonly size="sm" />
                        <span className="text-xs text-gray-400">{formatDate(review.created_at || review.createdAt)}</span>
                      </div>

                      <p className="text-sm text-gray-700 line-clamp-2">
                        {review.comment}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-medium">
                          {review.is_anonymous ? '匿名用户' : review.user?.full_name || '用户'}
                        </span>
                        {review.order?.string?.brand && (
                          <span className="text-gray-400">
                            {review.order.string.brand} {review.order.string.model || ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
