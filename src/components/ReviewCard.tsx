/**
 * 评价卡片组件 (Review Card Component)
 *
 * 显示单条评价信息，支持点赞交互
 */

'use client';

import React, { useState } from 'react';
import { OrderReview, toggleReviewLike } from '@/services/reviewService';
import StarRating from '@/components/StarRating';
import Card from '@/components/Card';
import { formatDate } from '@/lib/utils';
import { Share2, Heart } from 'lucide-react';
import Toast from '@/components/Toast';
import { buildReviewShareMessage } from '@/lib/share';
import { useSession } from 'next-auth/react';

interface ReviewCardProps {
  review: OrderReview;
  showOrder?: boolean;  // 是否显示订单信息
  showLikeButton?: boolean; // 是否显示点赞按钮
  onLikeChange?: (reviewId: string, liked: boolean, likesCount: number) => void;
}

export default function ReviewCard({ review, showOrder = false, showLikeButton = false, onLikeChange }: ReviewCardProps) {
  const { data: session, status } = useSession();
  const referralCode = (session?.user as any)?.referral_code as string | undefined;
  const currentUserId = session?.user?.id;

  // 点赞状态
  const [isLiked, setIsLiked] = useState(review.isLiked || review.is_liked || false);
  const [likesCount, setLikesCount] = useState(review.likesCount || review.likes_count || 0);
  const [likeLoading, setLikeLoading] = useState(false);

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success',
  });

  // 判断是否可以点赞（不能给自己的评价点赞）
  const isOwnReview = Boolean(currentUserId && (review.userId === currentUserId || review.user_id === currentUserId));
  const canLike = showLikeButton && !isOwnReview && status === 'authenticated';

  const handleLike = async () => {
    if (likeLoading) return;

    if (status !== 'authenticated') {
      setToast({
        show: true,
        message: '请先登录后再点赞',
        type: 'error',
      });
      return;
    }

    if (isOwnReview) {
      setToast({
        show: true,
        message: '不能给自己的评价点赞',
        type: 'error',
      });
      return;
    }

    setLikeLoading(true);

    // 乐观更新
    const newLiked = !isLiked;
    const newCount = newLiked ? likesCount + 1 : likesCount - 1;
    setIsLiked(newLiked);
    setLikesCount(newCount);

    const result = await toggleReviewLike(review.id);

    if (result) {
      setIsLiked(result.liked);
      setLikesCount(result.likesCount);
      onLikeChange?.(review.id, result.liked, result.likesCount);
    } else {
      // 回滚
      setIsLiked(!newLiked);
      setLikesCount(likesCount);
      setToast({
        show: true,
        message: '操作失败，请稍后重试',
        type: 'error',
      });
    }

    setLikeLoading(false);
  };

  const handleShare = async () => {
    if (!referralCode) {
      setToast({
        show: true,
        message: '暂无邀请码，无法分享',
        type: 'error',
      });
      return;
    }

    const message = buildReviewShareMessage({ rating: Number(review.rating) || 0 }, referralCode);
    if (!message) {
      setToast({
        show: true,
        message: '生成分享内容失败',
        type: 'error',
      });
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'LW String Studio 评价分享',
          text: message,
        });
        setToast({
          show: true,
          message: '分享成功',
          type: 'success',
        });
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          setToast({
            show: true,
            message: '分享失败，请稍后重试',
            type: 'error',
          });
        }
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(message);
      setToast({
        show: true,
        message: '分享内容已复制',
        type: 'success',
      });
    } catch {
      setToast({
        show: true,
        message: '复制失败，请手动复制',
        type: 'error',
      });
    }
  };

  return (
    <Card className="p-4">
      {/* 头部：评分 + 用户信息 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <StarRating value={Number(review.rating) || 0} readonly size="md" />
            <span className="text-sm font-medium text-text-primary">
              {Number.isFinite(Number(review.rating))
                ? Number(review.rating).toFixed(1)
                : '0.0'}{' '}
              分
            </span>
          </div>
          <p className="text-sm text-text-secondary">
            {review.is_anonymous ? '匿名用户' : review.user?.full_name || '用户'}
          </p>
        </div>
        <span className="text-xs text-text-tertiary">
          {formatDate(review.created_at || review.createdAt || new Date())}
        </span>
      </div>

      {/* 详细评分 */}
      {(review.service_rating || review.quality_rating || review.speed_rating) && (
        <div className="mb-3 pb-3 border-b border-border-subtle">
          <div className="grid grid-cols-3 gap-4 text-xs">
            {review.service_rating && (
              <div>
                <p className="text-text-secondary mb-1">服务态度</p>
                <StarRating value={review.service_rating} readonly size="sm" />
              </div>
            )}
            {review.quality_rating && (
              <div>
                <p className="text-text-secondary mb-1">穿线质量</p>
                <StarRating value={review.quality_rating} readonly size="sm" />
              </div>
            )}
            {review.speed_rating && (
              <div>
                <p className="text-text-secondary mb-1">服务速度</p>
                <StarRating value={review.speed_rating} readonly size="sm" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 标签 */}
      {review.tags && review.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {review.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-info-soft text-info"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 评价内容 */}
      <p className="text-sm text-text-secondary leading-relaxed mb-3">
        {review.comment}
      </p>

      {/* 订单信息（可选） */}
      {showOrder && review.order && (
        <div className="mt-3 pt-3 border-t border-border-subtle">
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>
              订单：
              {review.order.string?.brand} {review.order.string?.model}
            </span>
            <span>RM {review.order.final_price?.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* 有帮助数（可选） */}
      {!showLikeButton && (review.helpful_count || 0) > 0 && (
        <div className="mt-3 pt-3 border-t border-border-subtle">
          <p className="text-xs text-text-tertiary">
            {review.helpful_count} 人觉得有帮助
          </p>
        </div>
      )}

      {/* 点赞和分享操作栏 */}
      {(showLikeButton || referralCode) && (
        <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between">
          {/* 点赞按钮 */}
          {showLikeButton && (
            <button
              type="button"
              onClick={handleLike}
              disabled={likeLoading || isOwnReview}
              className={`
                inline-flex items-center gap-1.5 text-sm font-medium transition-colors
                ${isLiked
                  ? 'text-red-500'
                  : 'text-text-tertiary hover:text-red-500'
                }
                ${(likeLoading || isOwnReview) ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <Heart
                className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`}
              />
              <span>{likesCount}</span>
            </button>
          )}

          {/* 分享按钮 */}
          {referralCode && (
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors ml-auto"
            >
              <Share2 className="w-4 h-4" />
              分享评价
            </button>
          )}
        </div>
      )}

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </Card>
  );
}
