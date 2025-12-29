/**
 * Review Service
 * 处理评价相关业务逻辑
 */

import { isValidUUID } from '@/lib/utils';
import { apiRequest } from '@/services/apiClient';

// 待评价订单接口
export interface PendingReviewOrder {
  id: string;
  created_at: string;
  price: number;
  discount_amount: number | null;
  tension: number;
  string: {
    brand: string;
    model: string;
  } | null;
}


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
export async function getUserReviews(userId?: string): Promise<OrderReview[]> {
  if (userId && !isValidUUID(userId)) return [];
  try {
    const payload = await apiRequest<any[]>(`/api/reviews/user`);
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
    const review = await apiRequest<any>(`/api/reviews/order/${orderId}`);
    return review ? normalizeReview(review) : null;
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
    const order = await apiRequest<{ status?: string }>(`/api/orders/${orderId}`);
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
    const reviewPayload = await apiRequest<any>(`/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const normalized = normalizeReview({
      ...reviewPayload,
      order_id: params.order_id || params.orderId || reviewPayload?.order_id,
      user_id: (reviewPayload as any)?.user_id || (reviewPayload as any)?.userId || userId,
    });
    return { reviewId: normalized.id, review: normalized };
  } catch (error: any) {
    console.error('Failed to submit review:', error);
    return { error: error?.message || 'Failed to submit review' };
  }
}

/**
 * 获取精选评价
 */
export async function getFeaturedReviews(): Promise<OrderReview[]> {
  try {
    const payload = await apiRequest<any[]>(`/api/reviews/featured`);
    if (!Array.isArray(payload)) return [];
    return payload.map(normalizeReview);
  } catch {
    return [];
  }
}

/**
 * 获取公开评价（用于"查看全部"）
 */
export async function getPublicReviews(): Promise<OrderReview[]> {
  try {
    const payload = await apiRequest<any[]>(`/api/reviews/public`);
    if (!Array.isArray(payload)) return [];
    return payload.map(normalizeReview);
  } catch {
    return [];
  }
}

/**
 * 获取公开评价详情
 */
export async function getPublicReviewById(reviewId: string): Promise<OrderReview | null> {
  if (!isValidUUID(reviewId)) return null;
  try {
    const payload = await apiRequest<any>(`/api/reviews/public/${reviewId}`);
    return payload ? normalizeReview(payload) : null;
  } catch {
    return null;
  }
}

/**
 * Admin: 获取评价列表
 */
export async function getAdminReviews(): Promise<OrderReview[]> {
  try {
    const payload = await apiRequest<any[]>(`/api/admin/reviews`);
    if (!Array.isArray(payload)) return [];
    return payload.map(normalizeReview);
  } catch {
    return [];
  }
}

/**
 * Admin: 获取评价统计
 */
export async function getAdminReviewStats(): Promise<any> {
  return apiRequest(`/api/admin/reviews/stats`);
}

/**
 * Admin: 回复评价
 */
export async function replyReview(reviewId: string, reply: string): Promise<any> {
  return apiRequest(`/api/admin/reviews/${reviewId}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reply }),
  });
}

/**
 * 获取待评价订单（已完成但未评价）
 */
export async function getPendingReviewOrders(): Promise<PendingReviewOrder[]> {
  try {
    const orders = await apiRequest<PendingReviewOrder[]>(`/api/reviews/pending`);
    return Array.isArray(orders) ? orders : [];
  } catch {
    return [];
  }
}
