/**
 * 用户评价列表页面 (User Reviews List Page)
 * 
 * 用户个人中心 - 我的评价
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { OrderReview } from '@/services/reviewService';
import Card from '@/components/Card';
import Spinner from '@/components/Spinner';
import Button from '@/components/Button';
import StarRating from '@/components/StarRating';
import { formatDate } from '@/lib/utils';
import { MessageSquare, ChevronRight, Star } from 'lucide-react';
import Link from 'next/link';

export default function MyReviewsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthenticated = !!session;
  const authLoading = status === 'loading';
  const [reviews, setReviews] = useState<OrderReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      loadReviews();
    }
  }, [isAuthenticated, authLoading]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reviews/user');
      const data = await response.json();
      const list = data?.data?.reviews || data?.data;
      if (response.ok && Array.isArray(list)) {
        setReviews(list);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ink">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">我的评价</h1>
          <p className="mt-1 text-sm text-text-secondary">
            查看您对订单的评价记录
          </p>
        </div>

        {/* 统计卡片 */}
        {reviews.length > 0 && (
          <Card className="p-6 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-accent">{reviews.length}</p>
                <p className="text-sm text-text-secondary">总评价数</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-warning">
                  {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                </p>
                <p className="text-sm text-text-secondary">平均评分</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-success">
                  {reviews.filter((r) => r.admin_reply).length}
                </p>
                <p className="text-sm text-text-secondary">商家回复</p>
              </div>
            </div>
          </Card>
        )}

        {/* 评价列表 */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <Card className="p-12 text-center">
              <MessageSquare className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
              <p className="text-text-secondary mb-4">您还没有发表过评价</p>
              <Link href="/profile/orders">
                <Button variant="primary">
                  查看订单
                </Button>
              </Link>
            </Card>
          ) : (
            reviews.map((review) => (
              <Card key={review.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <StarRating value={review.rating} readonly size="md" />
                      <span className="text-sm text-text-secondary">
                        {review.created_at || review.createdAt ? formatDate(review.created_at || review.createdAt!) : '未知'}
                      </span>
                    </div>

                    {review.order?.string && (
                      <p className="text-sm text-text-secondary mb-2">
                        {review.order.string.brand} {review.order.string.model}
                      </p>
                    )}
                  </div>

                  <Link href={`/orders/${review.order_id}`}>
                    <Button variant="secondary" size="sm">
                      查看订单
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>

                {/* 详细评分 */}
                <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-ink-elevated rounded-lg border border-border-subtle">
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">服务态度</p>
                    <StarRating value={review.service_rating || review.serviceRating || 0} readonly size="xs" />
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">穿线质量</p>
                    <StarRating value={review.quality_rating || review.qualityRating || 0} readonly size="xs" />
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary mb-1">服务速度</p>
                    <StarRating value={review.speed_rating || review.speedRating || 0} readonly size="xs" />
                  </div>
                </div>

                {/* 评价内容 */}
                <p className="text-text-secondary mb-3">{review.comment}</p>

                {/* 标签 */}
                {review.tags && review.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {review.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-info-soft text-info text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 管理员回复 */}
                {review.admin_reply && (
                  <div className="mt-4 p-4 bg-warning/15 border-l-4 border-warning rounded">
                    <p className="text-xs text-warning font-medium mb-1">
                      商家回复
                    </p>
                    <p className="text-sm text-text-secondary">{review.admin_reply}</p>
                  </div>
                )}

                {/* 有帮助统计 */}
                {(review.helpful_count || review.helpfulCount) && (review.helpful_count || review.helpfulCount)! > 0 && (
                  <div className="mt-3 text-xs text-text-tertiary">
                    {review.helpful_count || review.helpfulCount} 人觉得有帮助
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
