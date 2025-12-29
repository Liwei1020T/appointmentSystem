/**
 * 首页精选评价组件 (Featured Reviews Component)
 * 
 * 紧凑设计：横向卡片轮播，占用较少垂直空间
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Star, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getFeaturedReviews } from '@/services/reviewService';

interface Review {
  id: string;
  rating: number;
  comment: string;
  tags: string[];
  is_anonymous: boolean;
  created_at: string;
  user?: {
    full_name: string;
  };
  order?: {
    string?: {
      brand: string;
      model: string;
    };
  };
}

export default function FeaturedReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFeaturedReviews();
  }, []);

  // 自动滚动
  useEffect(() => {
    if (reviews.length <= 1) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const cardWidth = 280 + 12; // card width + gap
        const maxScroll = scrollWidth - clientWidth;

        if (scrollLeft >= maxScroll - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [reviews]);

  const loadFeaturedReviews = async () => {
    try {
      const data = await getFeaturedReviews();
      const normalized = data.map((review: any) => ({
        ...review,
        user: Array.isArray(review?.user) ? review.user[0] : review?.user,
        order: review?.order
          ? {
            ...review.order,
            string: Array.isArray(review.order?.string)
              ? review.order.string[0]
              : review.order?.string,
          }
          : undefined,
      }));
      setReviews(normalized as Review[]);
    } catch (error) {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading || reviews.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* 标题行 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          </div>
          <h3 className="font-semibold text-[15px] text-gray-900">用户评价</h3>
        </div>
        <Link
          href="/reviews/all"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          查看全部
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 横向滚动评价列表 */}
      <div
        ref={scrollRef}
        className="flex gap-3 px-5 py-4 overflow-x-auto scrollbar-hide scroll-smooth"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {reviews.map((review) => (
          <Link
            key={review.id}
            href={`/reviews/all/${review.id}`}
            className="flex-shrink-0 w-[280px]"
            style={{ scrollSnapAlign: 'start' }}
          >
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
              {/* 星级 */}
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                  />
                ))}
              </div>

              {/* 评论内容 */}
              <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">
                "{review.comment}"
              </p>

              {/* 用户信息 */}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="font-medium text-gray-500">
                  {review.is_anonymous ? '匿名用户' : review.user?.full_name}
                </span>
                {review.order?.string && (
                  <span>{review.order.string.brand}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
