/**
 * 评价详情页面 (Review Detail Page)
 *
 * 展示单条评价的完整内容与图片。
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import { Card } from '@/components';
import ImagePreview from '@/components/ImagePreview';
import StarRating from '@/components/StarRating';
import SectionLoading from '@/components/loading/SectionLoading';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getPublicReviewById, type OrderReview } from '@/services/reviewService';

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reviewId = params?.id as string | undefined;
  const [review, setReview] = useState<OrderReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!reviewId) return;
    const loadReview = async () => {
      const data = await getPublicReviewById(reviewId);
      setReview(data);
      setLoading(false);
    };
    loadReview();
  }, [reviewId]);

  return (
    <div className="min-h-screen bg-ink">
      <PageHeader title="评价详情" subtitle="查看完整评价内容" onBack={() => router.push('/reviews/all')} />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <Card className="p-6">
            <SectionLoading label="正在加载评价..." />
          </Card>
        ) : !review ? (
          <Card className="p-6">
            <p className="text-sm text-text-secondary">评价不存在或已隐藏</p>
          </Card>
        ) : (
          <>
            <Card className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <StarRating value={Number(review.rating) || 0} readonly size="md" />
                  <span className="text-sm font-semibold text-text-primary">
                    {(Number(review.rating) || 0).toFixed(1)} 分
                  </span>
                </div>
                <div className="text-xs text-text-tertiary">
                  {formatDate(review.created_at || review.createdAt)}
                </div>
              </div>

              <div className="text-sm text-text-secondary">
                {review.is_anonymous ? '匿名用户' : review.user?.full_name || '用户'}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 pt-1">
                <div className="space-y-1">
                  <div className="text-xs text-text-tertiary">服务态度</div>
                  <StarRating value={Number(review.service_rating || review.rating) || 0} readonly size="sm" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-text-tertiary">穿线质量</div>
                  <StarRating value={Number(review.quality_rating || review.rating) || 0} readonly size="sm" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-text-tertiary">服务速度</div>
                  <StarRating value={Number(review.speed_rating || review.rating) || 0} readonly size="sm" />
                </div>
              </div>

              <div className="border-t border-border-subtle pt-4 space-y-3">
                {review.tags && review.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {review.tags.map((tag, index) => (
                      <span key={index} className="px-3 py-1 rounded-full bg-info/10 text-info text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                  {review.comment}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border-subtle pt-4 text-sm text-text-secondary">
                <span>订单:</span>
                <span className="font-semibold text-text-primary">
                  {formatCurrency(Number(review.order?.final_price ?? review.order?.finalPrice ?? 0))}
                </span>
              </div>
            </Card>

            {review.imageUrls && review.imageUrls.length > 0 && (
              <Card className="p-5 space-y-3">
                <h3 className="text-sm font-semibold text-text-primary">评价图片</h3>
                <div className="grid grid-cols-3 gap-3">
                  {review.imageUrls.map((url, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setPreviewIndex(index);
                        setShowPreview(true);
                      }}
                      className="group w-full h-24 overflow-hidden rounded-lg border border-border-subtle"
                    >
                      <img
                        src={url}
                        alt={`review-${index}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {review.admin_reply && (
              <Card className="p-5 space-y-2 border border-border-subtle">
                <div className="text-sm font-semibold text-text-primary">管理员回复</div>
                <p className="text-sm text-text-secondary">{review.admin_reply}</p>
              </Card>
            )}
          </>
        )}
      </div>

      <ImagePreview
        images={review?.imageUrls || []}
        initialIndex={previewIndex}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </div>
  );
}
