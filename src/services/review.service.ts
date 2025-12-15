/**
 * Review Service
 * 处理评价相关业务逻辑
 */

import { prisma } from '@/lib/prisma';

export interface OrderReview {
  id: string;
  orderId: string;
  order_id?: string;
  userId: string;
  user_id?: string;
  rating: number;
  serviceRating: number;
  service_rating?: number;
  qualityRating: number;
  quality_rating?: number;
  speedRating: number;
  speed_rating?: number;
  comment: string;
  tags: string[];
  imageUrls: string[];
  image_urls?: string[];
  isAnonymous: boolean;
  is_anonymous?: boolean;
  adminReply?: string;
  admin_reply?: string;
  createdAt: Date;
  created_at?: Date | string;
  updatedAt: Date;
  updated_at?: Date | string;
  helpful_count?: number;
  helpfulCount?: number;
  user?: {
    id?: string;
    full_name?: string;
    fullName?: string;
    avatar?: string;
    avatar_url?: string;
  };
  order?: {
    id?: string;
    final_price?: number;
    finalPrice?: number;
    string?: {
      brand?: string;
      model?: string;
    };
  };
}

export interface SubmitReviewParams {
  orderId?: string;
  order_id?: string;
  rating: number;
  serviceRating?: number;
  service_rating?: number;
  qualityRating?: number;
  quality_rating?: number;
  speedRating?: number;
  speed_rating?: number;
  comment: string;
  tags?: string[];
  imageUrls?: string[];
  image_urls?: string[];
  images?: string[];
  isAnonymous?: boolean;
  is_anonymous?: boolean;
}

/**
 * 获取用户的所有评价
 */
export async function getUserReviews(userId: string): Promise<OrderReview[]> {
  const reviews = await prisma.$queryRaw<any[]>`
    SELECT * FROM order_reviews 
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
  
  return reviews.map((r: any) => ({
    id: r.id,
    orderId: r.order_id,
    userId: r.user_id,
    rating: r.rating,
    serviceRating: r.service_rating,
    qualityRating: r.quality_rating,
    speedRating: r.speed_rating,
    comment: r.comment,
    tags: r.tags || [],
    imageUrls: r.image_urls || [],
    isAnonymous: r.is_anonymous,
    adminReply: r.admin_reply,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  }));
}

/**
 * 获取订单的评价
 */
export async function getOrderReview(orderId: string): Promise<OrderReview | null> {
  const reviews = await prisma.$queryRaw<any[]>`
    SELECT * FROM order_reviews 
    WHERE order_id = ${orderId}
    LIMIT 1
  `;
  
  if (reviews.length === 0) return null;
  
  const r = reviews[0];
  return {
    id: r.id,
    orderId: r.order_id,
    userId: r.user_id,
    rating: r.rating,
    serviceRating: r.service_rating,
    qualityRating: r.quality_rating,
    speedRating: r.speed_rating,
    comment: r.comment,
    tags: r.tags || [],
    imageUrls: r.image_urls || [],
    isAnonymous: r.is_anonymous,
    adminReply: r.admin_reply,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  };
}

/**
 * 检查是否可以评价订单
 */
export async function canReviewOrder(orderId: string, userId: string): Promise<boolean> {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId: userId,
      status: 'completed',
    },
  });
  
  if (!order) return false;
  
  const existingReview = await getOrderReview(orderId);
  return !existingReview;
}

/**
 * 提交评价
 */
export async function submitReview(params: SubmitReviewParams, userId?: string): Promise<{ reviewId?: string; review?: OrderReview; error?: string }> {
  try {
    // Try API call first for client-side
    if (typeof window !== 'undefined') {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        const data = await response.json();
        return { error: data.error || 'Failed to submit review' };
      }
      
      const data = await response.json();
      return { reviewId: data.id, review: data };
    }
    
    // Server-side execution
    const orderId = params.orderId || params.order_id;
    const rating = params.rating;
    const serviceRating = params.serviceRating || params.service_rating || 0;
    const qualityRating = params.qualityRating || params.quality_rating || 0;
    const speedRating = params.speedRating || params.speed_rating || 0;
    const tags = params.tags || [];
    const imageUrls = params.imageUrls || params.image_urls || params.images || [];
    const isAnonymous = params.isAnonymous ?? params.is_anonymous ?? false;
    
    const review = await prisma.$queryRaw<any[]>`
      INSERT INTO order_reviews (
        order_id, user_id, rating, service_rating, quality_rating, speed_rating,
        comment, tags, image_urls, is_anonymous
      )
      VALUES (
        ${orderId}, ${userId}, ${rating}, ${serviceRating},
        ${qualityRating}, ${speedRating}, ${params.comment},
        ${JSON.stringify(tags)}, ${JSON.stringify(imageUrls)}, ${isAnonymous}
      )
      RETURNING *
    `;
    
    const r = review[0];
    const mappedReview: OrderReview = {
      id: r.id,
      orderId: r.order_id,
      userId: r.user_id,
      rating: r.rating,
      serviceRating: r.service_rating,
      qualityRating: r.quality_rating,
      speedRating: r.speed_rating,
      comment: r.comment,
      tags: r.tags || [],
      imageUrls: r.image_urls || [],
      isAnonymous: r.is_anonymous,
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
    };
    
    return { reviewId: mappedReview.id, review: mappedReview };
  } catch (error) {
    console.error('Failed to submit review:', error);
    return { error: 'Failed to submit review' };
  }
}
