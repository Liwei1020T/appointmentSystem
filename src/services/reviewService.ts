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

// Normalize any review payload (camelCase or snake_case) into a consistent shape.
function normalizeReview(r: any): OrderReview {
  const rating = Number(r?.rating ?? 0);
  const serviceRating = Number(r?.service_rating ?? r?.serviceRating ?? 0);
  const qualityRating = Number(r?.quality_rating ?? r?.qualityRating ?? 0);
  const speedRating = Number(r?.speed_rating ?? r?.speedRating ?? 0);
  const tags = r?.tags || [];
  const imageUrls = r?.images || r?.image_urls || r?.imageUrls || [];
  const createdAtValue = r?.created_at || r?.createdAt || new Date();
  const updatedAtValue = r?.updated_at || r?.updatedAt || new Date();

  return {
    id: r?.id || crypto.randomUUID(),
    orderId: r?.order_id || r?.orderId || '',
    order_id: r?.order_id || r?.orderId,
    userId: r?.user_id || r?.userId || '',
    user_id: r?.user_id || r?.userId,
    rating,
    serviceRating: serviceRating || rating,
    service_rating: serviceRating || rating,
    qualityRating: qualityRating || rating,
    quality_rating: qualityRating || rating,
    speedRating: speedRating || rating,
    speed_rating: speedRating || rating,
    comment: r?.comment || '',
    tags: Array.isArray(tags) ? tags : [],
    imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
    image_urls: Array.isArray(imageUrls) ? imageUrls : [],
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
  try {
    const response = await fetch('/api/reviews/user');
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return [];
    const payload = data?.data?.reviews ?? data?.data ?? data?.reviews ?? [];
    if (!Array.isArray(payload)) return [];
    return payload.map(normalizeReview);
  } catch (_error) {
    return [];
  }
}

/**
 * 获取订单的评价
 */
export async function getOrderReview(orderId: string): Promise<OrderReview | null> {
  if (!isValidUUID(orderId)) return null;

  try {
    const response = await fetch(`/api/reviews/order/${orderId}`);
    if (!response.ok) return null;
    const data = await response.json().catch(() => ({}));
    // API returns { success, data: { review: Review | null } }
    const payload = data?.data ?? data;
    const review = payload?.review ?? null;
    if (!review) return null;
    return normalizeReview(review);
  } catch (_err) {
    return null;
  }
}

/**
 * 检查是否可以评价订单
 */
export async function canReviewOrder(orderId: string, userId: string): Promise<boolean> {
  if (!isValidUUID(orderId) || !isValidUUID(userId)) return false;

  const existingReview = await getOrderReview(orderId);
  if (existingReview) return false;

  try {
    const orderRes = await fetch(`/api/orders/${orderId}`);
    const orderJson = await orderRes.json().catch(() => ({}));
    if (!orderRes.ok) return false;
    const order = orderJson?.data ?? orderJson;
    return order?.status === 'completed';
  } catch (_error) {
    return false;
  }
}

/**
 * 提交评价
 */
export async function submitReview(params: SubmitReviewParams, userId?: string): Promise<{ reviewId?: string; review?: OrderReview; error?: string }> {
  try {
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { error: data.error || 'Failed to submit review' };
    }

    const reviewPayload = data?.data ?? data?.review ?? data;
    const normalized = normalizeReview({
      ...reviewPayload,
      order_id: params.order_id || params.orderId || reviewPayload?.order_id,
      user_id: reviewPayload?.user_id || reviewPayload?.userId || userId,
    });
    return { reviewId: normalized.id, review: normalized };
  } catch (error) {
    console.error('Failed to submit review:', error);
    return { error: 'Failed to submit review' };
  }
}
