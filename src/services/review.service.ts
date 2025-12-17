/**
 * Review Service
 * 处理评价相关业务逻辑
 */

import { isValidUUID } from '@/lib/utils';

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

// Lazy-load Prisma only on the server to avoid bundling it in the browser.
async function getPrisma() {
  if (typeof window !== 'undefined') {
    throw new Error('Prisma is not available in the browser');
  }
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

// Normalize any review payload (camelCase or snake_case) into a consistent shape.
function normalizeReview(r: any): OrderReview {
  const rating = Number(r?.rating ?? 0);
  const serviceRating = Number(r?.service_rating ?? r?.serviceRating ?? 0);
  const qualityRating = Number(r?.quality_rating ?? r?.qualityRating ?? 0);
  const speedRating = Number(r?.speed_rating ?? r?.speedRating ?? 0);
  const tags = r?.tags || [];
  const imageUrls = r?.image_urls || r?.imageUrls || [];
  const createdAtValue = r?.created_at || r?.createdAt || new Date();
  const updatedAtValue = r?.updated_at || r?.updatedAt || new Date();

  return {
    id: r?.id || crypto.randomUUID(),
    orderId: r?.order_id || r?.orderId || '',
    order_id: r?.order_id || r?.orderId,
    userId: r?.user_id || r?.userId || '',
    user_id: r?.user_id || r?.userId,
    rating,
    serviceRating,
    service_rating: serviceRating,
    qualityRating,
    quality_rating: qualityRating,
    speedRating,
    speed_rating: speedRating,
    comment: r?.comment || '',
    tags,
    imageUrls,
    image_urls: imageUrls,
    isAnonymous: r?.is_anonymous ?? r?.isAnonymous ?? false,
    is_anonymous: r?.is_anonymous ?? r?.isAnonymous ?? false,
    adminReply: r?.admin_reply ?? r?.adminReply,
    admin_reply: r?.admin_reply ?? r?.adminReply,
    createdAt: new Date(createdAtValue),
    created_at: createdAtValue,
    updatedAt: new Date(updatedAtValue),
    updated_at: updatedAtValue,
    helpful_count: r?.helpful_count ?? r?.helpfulCount,
    helpfulCount: r?.helpful_count ?? r?.helpfulCount,
    order: r?.order,
    user: r?.user,
  };
}

/**
 * 获取用户的所有评价
 */
export async function getUserReviews(userId: string): Promise<OrderReview[]> {
  if (!isValidUUID(userId)) return [];

  const prisma = await getPrisma();
  const reviews = await prisma.$queryRaw<any[]>`
    SELECT * FROM order_reviews 
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;

  return reviews.map(normalizeReview);
}

/**
 * 获取订单的评价
 */
export async function getOrderReview(orderId: string): Promise<OrderReview | null> {
  if (!isValidUUID(orderId)) return null;

  // Client side: fetch API to avoid Prisma in browser
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch(`/api/reviews/order/${orderId}`);
      if (!response.ok) return null;
      const data = await response.json();
      const r = data.review || data.data || null;
      if (!r) return null;
      return normalizeReview(r);
    } catch (_err) {
      return null;
    }
  }

  // Server side (only)
  const prisma = await getPrisma();
  const reviews = await prisma.$queryRaw<any[]>`
    SELECT * FROM order_reviews 
    WHERE order_id = ${orderId}
    LIMIT 1
  `;
  
  if (reviews.length === 0) return null;

  return normalizeReview(reviews[0]);
}

/**
 * 检查是否可以评价订单
 */
export async function canReviewOrder(orderId: string, userId: string): Promise<boolean> {
  if (!isValidUUID(orderId) || !isValidUUID(userId)) return false;

  // Client side: best-effort check via API/no-op
  if (typeof window !== 'undefined') {
    const existing = await getOrderReview(orderId);
    return !existing;
  }

  const prisma = await getPrisma();
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
      const reviewPayload = data?.data || data?.review || data;
      const normalized = normalizeReview({
        ...reviewPayload,
        order_id: params.order_id || params.orderId || reviewPayload?.order_id,
        user_id: reviewPayload?.user_id || reviewPayload?.userId || userId,
      });
      return { reviewId: normalized.id, review: normalized };
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
    
    const prisma = await getPrisma();
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
    
    const mappedReview = normalizeReview(review[0]);
    return { reviewId: mappedReview.id, review: mappedReview };
  } catch (error) {
    console.error('Failed to submit review:', error);
    return { error: 'Failed to submit review' };
  }
}
