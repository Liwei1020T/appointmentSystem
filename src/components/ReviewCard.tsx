/**
 * 评价卡片组件 (Review Card Component)
 * 
 * 显示单条评价信息
 */

'use client';

import React from 'react';
import { OrderReview } from '@/services/review.service';
import StarRating from '@/components/StarRating';
import Card from '@/components/Card';
import { formatDate } from '@/lib/utils';

interface ReviewCardProps {
  review: OrderReview;
  showOrder?: boolean;  // 是否显示订单信息
}

export default function ReviewCard({ review, showOrder = false }: ReviewCardProps) {
  return (
    <Card className="p-4">
      {/* 头部：评分 + 用户信息 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <StarRating value={review.rating} readonly size="md" />
            <span className="text-sm font-medium text-slate-900">
              {review.rating.toFixed(1)} 分
            </span>
          </div>
          <p className="text-sm text-slate-600">
            {review.is_anonymous ? '匿名用户' : review.user?.full_name || '用户'}
          </p>
        </div>
        <span className="text-xs text-slate-500">
          {formatDate(review.created_at || review.createdAt || new Date())}
        </span>
      </div>

      {/* 详细评分 */}
      {(review.service_rating || review.quality_rating || review.speed_rating) && (
        <div className="mb-3 pb-3 border-b border-slate-200">
          <div className="grid grid-cols-3 gap-4 text-xs">
            {review.service_rating && (
              <div>
                <p className="text-slate-600 mb-1">服务态度</p>
                <StarRating value={review.service_rating} readonly size="sm" />
              </div>
            )}
            {review.quality_rating && (
              <div>
                <p className="text-slate-600 mb-1">穿线质量</p>
                <StarRating value={review.quality_rating} readonly size="sm" />
              </div>
            )}
            {review.speed_rating && (
              <div>
                <p className="text-slate-600 mb-1">服务速度</p>
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
              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 评价内容 */}
      <p className="text-sm text-slate-700 leading-relaxed mb-3">
        {review.comment}
      </p>

      {/* 订单信息（可选） */}
      {showOrder && review.order && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>
              订单：
              {review.order.string?.brand} {review.order.string?.model}
            </span>
            <span>RM {review.order.final_price?.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* 有帮助数（可选） */}
      {(review.helpful_count || 0) > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            {review.helpful_count} 人觉得有帮助
          </p>
        </div>
      )}
    </Card>
  );
}
