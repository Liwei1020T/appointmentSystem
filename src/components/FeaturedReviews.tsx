/**
 * 首页精选评价组件 (Featured Reviews Component)
 * 
 * 在首页展示高质量评价，增强用户信任
 */

'use client';

import React, { useState, useEffect } from 'react';
import Card from '@/components/Card';
import StarRating from '@/components/StarRating';
import Button from '@/components/Button';
import { formatDate } from '@/lib/utils';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedReviews();
  }, []);

  const loadFeaturedReviews = async () => {
    try {
      const response = await fetch('/api/reviews/featured');
      const result = await response.json();
      
      if (response.ok && (result.data || result.reviews)) {
        const data = result.data || result.reviews;
        const normalized = data.map((review: any) => ({
          ...review,
          user: Array.isArray(review.user) ? review.user[0] : review.user,
          order: review.order
            ? {
                ...review.order,
                string: Array.isArray(review.order?.string)
                  ? review.order.string[0]
                  : review.order?.string,
              }
            : undefined,
        }));
        setReviews(normalized as Review[]);
      }
    } catch (error) {
      console.error('Failed to load featured reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextReview = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  if (loading || reviews.length === 0) {
    return null;
  }

  const currentReview = reviews[currentIndex];

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full mb-4">
            <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
            <span className="font-medium">客户好评</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            真实用户评价
          </h2>
          <p className="text-slate-600">
            来自数百位满意客户的真实反馈
          </p>
        </div>

        <div className="relative">
          <Card className="p-8 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-4 justify-center">
              <StarRating value={currentReview.rating} readonly size="lg" />
            </div>

            <blockquote className="text-lg text-slate-700 text-center mb-6 italic">
              &ldquo;{currentReview.comment}&rdquo;
            </blockquote>

            {currentReview.tags && currentReview.tags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {currentReview.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="text-center">
              <p className="font-semibold text-slate-900">
                {currentReview.is_anonymous
                  ? '匿名用户'
                  : currentReview.user?.full_name}
              </p>
              {currentReview.order?.string && (
                <p className="text-sm text-slate-600">
                  {currentReview.order.string.brand} {currentReview.order.string.model}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                {formatDate(currentReview.created_at)}
              </p>
            </div>
          </Card>

          {/* 导航按钮 */}
          {reviews.length > 1 && (
            <>
              <button
                onClick={prevReview}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 p-3 bg-white rounded-full shadow-lg hover:bg-slate-50 transition-colors"
                aria-label="上一条评价"
              >
                <ChevronLeft className="w-6 h-6 text-slate-600" />
              </button>

              <button
                onClick={nextReview}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 p-3 bg-white rounded-full shadow-lg hover:bg-slate-50 transition-colors"
                aria-label="下一条评价"
              >
                <ChevronRight className="w-6 h-6 text-slate-600" />
              </button>
            </>
          )}

          {/* 指示器 */}
          <div className="flex justify-center gap-2 mt-6">
            {reviews.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex
                    ? 'bg-blue-600 w-8'
                    : 'bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`查看第 ${idx + 1} 条评价`}
              />
            ))}
          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="/reviews">
            <Button variant="secondary">
              查看所有评价 ({reviews.length}+)
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
