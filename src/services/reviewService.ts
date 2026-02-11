/**
 * Review Service
 * 处理评价相关业务逻辑
 */

import { isValidUUID } from '@/lib/utils';
import { apiRequest } from '@/services/apiClient';
import type { ReviewLike } from '@/lib/review-mapper';

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
  likesCount?: number;
  likes_count?: number;
  isLiked?: boolean;
  is_liked?: boolean;
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

export interface AdminReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_5: number;
  rating_4: number;
  rating_3: number;
  rating_2: number;
  rating_1: number;
  avg_service: number;
  avg_quality: number;
  avg_speed: number;
}

interface PublicReviewsPayload {
  reviews?: ReviewLike[];
  pagination?: PublicReviewsResponse['pagination'];
  summary?: PublicReviewsResponse['summary'];
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

// Normalize review payload (camelCase or snake_case) into a consistent shape.
function normalizeReview(r: ReviewLike): OrderReview {
  const rating = Number(r?.rating ?? 0);
  const serviceRating = Number(r?.service_rating ?? r?.serviceRating ?? 0);
  const qualityRating = Number(r?.quality_rating ?? r?.qualityRating ?? 0);
  const speedRating = Number(r?.speed_rating ?? r?.speedRating ?? 0);
  const tags = r?.tags || [];
  const imageUrls = r?.images || r?.image_urls || r?.imageUrls || [];
  const createdAtValue = r?.created_at || r?.createdAt || new Date();
  const updatedAtValue = r?.updated_at || r?.updatedAt || new Date();
  const likesCount = r?.likes_count ?? r?.likesCount ?? 0;
  const isLiked = r?.is_liked ?? r?.isLiked ?? false;

  // 转换 order 和 user 对象，移除 null 类型
  const orderData = r?.order && typeof r.order === 'object' ? {
    id: r.order.id,
    string: r.order.string || undefined,
  } : undefined;

  const userData = r?.user && typeof r.user === 'object' ? {
    id: r.user.id,
    full_name: r.user.full_name ?? r.user.fullName ?? undefined,
    fullName: r.user.fullName ?? r.user.full_name ?? undefined,
    email: r.user.email ?? undefined,
  } : undefined;

  return {
    id: r?.id || crypto.randomUUID(),
    orderId: r?.order_id || r?.orderId || '',
    order_id: r?.order_id || r?.orderId || '',
    userId: r?.user_id || r?.userId || '',
    user_id: r?.user_id || r?.userId || '',
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
    adminReply: r?.admin_reply ?? r?.adminReply ?? undefined,
    admin_reply: r?.admin_reply ?? r?.adminReply ?? undefined,
    createdAt: createdAtValue instanceof Date ? createdAtValue : new Date(createdAtValue),
    created_at: createdAtValue instanceof Date ? createdAtValue.toISOString() : String(createdAtValue),
    updatedAt: updatedAtValue instanceof Date ? updatedAtValue : new Date(updatedAtValue),
    updated_at: updatedAtValue instanceof Date ? updatedAtValue.toISOString() : String(updatedAtValue),
    helpful_count: r?.helpful_count ?? r?.helpfulCount ?? 0,
    helpfulCount: r?.helpful_count ?? r?.helpfulCount ?? 0,
    likesCount,
    likes_count: likesCount,
    isLiked,
    is_liked: isLiked,
    order: orderData,
    user: userData,
  };
}

/**
 * 获取用户的所有评价
 */
export async function getUserReviews(userId?: string): Promise<OrderReview[]> {
  if (userId && !isValidUUID(userId)) return [];
  try {
    const payload = await apiRequest<ReviewLike[]>(`/api/reviews/user`);
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
    const review = await apiRequest<ReviewLike>(`/api/reviews/order/${orderId}`);
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
    const reviewPayload = await apiRequest<ReviewLike>(`/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const normalized = normalizeReview({
      ...reviewPayload,
      order_id: params.order_id || params.orderId || reviewPayload?.order_id,
      user_id: reviewPayload?.user_id || reviewPayload?.userId || userId,
    });
    return { reviewId: normalized.id, review: normalized };
  } catch (error: unknown) {
    console.error('Failed to submit review:', error);
    return { error: getErrorMessage(error, 'Failed to submit review') };
  }
}

/**
 * 获取精选评价
 */
export async function getFeaturedReviews(): Promise<OrderReview[]> {
  try {
    const payload = await apiRequest<ReviewLike[]>(`/api/reviews/featured`);
    if (!Array.isArray(payload)) return [];
    return payload.map(normalizeReview);
  } catch {
    return [];
  }
}

/**
 * 获取公开评价（用于"查看全部"）
 */
export interface PublicReviewsParams {
  sort?: 'latest' | 'rating' | 'likes';
  rating?: number;
  page?: number;
  limit?: number;
}

export interface PublicReviewsResponse {
  reviews: OrderReview[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    total: number;
    byRating: Record<number, number>;
  };
}

export async function getPublicReviews(params: PublicReviewsParams = {}): Promise<PublicReviewsResponse> {
  try {
    const searchParams = new URLSearchParams();
    if (params.sort) searchParams.set('sort', params.sort);
    if (params.rating) searchParams.set('rating', String(params.rating));
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));

    const queryString = searchParams.toString();
    const url = `/api/reviews/public${queryString ? `?${queryString}` : ''}`;

    const payload = await apiRequest<PublicReviewsPayload>(url);

    return {
      reviews: Array.isArray(payload.reviews) ? payload.reviews.map(normalizeReview) : [],
      pagination: payload.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
      summary: payload.summary || { total: 0, byRating: {} },
    };
  } catch {
    return {
      reviews: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      summary: { total: 0, byRating: {} },
    };
  }
}

/**
 * 点赞/取消点赞评价
 */
export async function toggleReviewLike(reviewId: string): Promise<{ liked: boolean; likesCount: number } | null> {
  if (!isValidUUID(reviewId)) return null;
  try {
    const result = await apiRequest<{ liked: boolean; likesCount: number }>(`/api/reviews/${reviewId}/like`, {
      method: 'POST',
    });
    return result;
  } catch {
    return null;
  }
}

/**
 * 获取公开评价详情
 */
export async function getPublicReviewById(reviewId: string): Promise<OrderReview | null> {
  if (!isValidUUID(reviewId)) return null;
  try {
    const payload = await apiRequest<ReviewLike>(`/api/reviews/public/${reviewId}`);
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
    const payload = await apiRequest<ReviewLike[]>(`/api/admin/reviews`);
    if (!Array.isArray(payload)) return [];
    return payload.map(normalizeReview);
  } catch {
    return [];
  }
}

/**
 * Admin: 获取评价统计
 */
export async function getAdminReviewStats(): Promise<AdminReviewStats> {
  const payload = await apiRequest<Partial<AdminReviewStats>>(`/api/admin/reviews/stats`);
  return {
    total_reviews: Number(payload?.total_reviews ?? 0),
    average_rating: Number(payload?.average_rating ?? 0),
    rating_5: Number(payload?.rating_5 ?? 0),
    rating_4: Number(payload?.rating_4 ?? 0),
    rating_3: Number(payload?.rating_3 ?? 0),
    rating_2: Number(payload?.rating_2 ?? 0),
    rating_1: Number(payload?.rating_1 ?? 0),
    avg_service: Number(payload?.avg_service ?? 0),
    avg_quality: Number(payload?.avg_quality ?? 0),
    avg_speed: Number(payload?.avg_speed ?? 0),
  };
}

/**
 * Admin: 回复评价
 */
export async function replyReview(reviewId: string, reply: string): Promise<void> {
  await apiRequest<unknown>(`/api/admin/reviews/${reviewId}/reply`, {
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
