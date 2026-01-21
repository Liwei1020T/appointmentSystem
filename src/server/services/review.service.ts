import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-errors';
import { isValidUUID } from '@/lib/utils';
import { mapReviewToApiPayload } from '@/lib/review-mapper';
import { isAdminRole } from '@/lib/roles';

const REVIEW_REWARD_POINTS = 10;

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseRating(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < 1 || parsed > 5) return fallback;
  return parsed;
}

/**
 * Submit a review for a completed order.
 */
export async function submitReview(userId: string, body: any) {
  const orderId: string = body.order_id || body.orderId;
  const rating = parseRating(body.rating, 0);
  const comment = String(body.comment ?? '').trim();

  if (!isValidUUID(orderId)) {
    throw new ApiError('BAD_REQUEST', 400, 'Invalid order id');
  }

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new ApiError('UNPROCESSABLE_ENTITY', 422, 'Rating must be between 1 and 5');
  }

  if (comment.length < 10) {
    throw new ApiError('UNPROCESSABLE_ENTITY', 422, 'Comment must be at least 10 characters');
  }

  const photos = parseStringArray(body.images ?? body.image_urls ?? body.imageUrls ?? body.photos);
  const tags = parseStringArray(body.tags);
  const isAnonymous = Boolean(body.is_anonymous ?? body.isAnonymous ?? false);

  const serviceRating = parseRating(body.service_rating ?? body.serviceRating, rating);
  const qualityRating = parseRating(body.quality_rating ?? body.qualityRating, rating);
  const speedRating = parseRating(body.speed_rating ?? body.speedRating, rating);

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    select: { id: true, status: true },
  });

  if (!order) {
    throw new ApiError('NOT_FOUND', 404, 'Order not found');
  }

  if (order.status !== 'completed') {
    throw new ApiError('CONFLICT', 409, 'Order is not completed');
  }

  const existing = await prisma.review.findUnique({
    where: { orderId },
    select: { id: true },
  });
  if (existing) {
    throw new ApiError('CONFLICT', 409, 'Review already exists');
  }

  const created = await prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        orderId,
        userId,
        rating,
        comment,
        photos,
        tags,
        isAnonymous,
        serviceRating,
        qualityRating,
        speedRating,
      },
      include: {
        order: {
          select: {
            id: true,
            price: true,
            discount: true,
            discountAmount: true,
            string: { select: { brand: true, model: true } },
          },
        },
        user: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { points: { increment: REVIEW_REWARD_POINTS } },
      select: { points: true },
    });

    await tx.pointsLog.create({
      data: {
        userId,
        amount: REVIEW_REWARD_POINTS,
        type: 'review',
        referenceId: orderId,
        description: 'Review reward',
        balanceAfter: updatedUser.points,
      },
    });

    return review;
  });

  return mapReviewToApiPayload(created, { includeOrder: true, includeUser: true });
}

/**
 * Fetch completed orders that have not been reviewed yet.
 */
export async function getPendingReviewOrders(userId: string) {
  const completedOrders = await prisma.order.findMany({
    where: {
      userId,
      status: 'completed',
    },
    select: {
      id: true,
      createdAt: true,
      price: true,
      discountAmount: true,
      tension: true,
      string: {
        select: {
          brand: true,
          model: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const reviewedOrderIds = await prisma.review.findMany({
    where: { userId },
    select: { orderId: true },
  });
  const reviewedSet = new Set(reviewedOrderIds.map((r) => r.orderId));

  return completedOrders
    .filter((order) => !reviewedSet.has(order.id))
    .map((order) => ({
      id: order.id,
      created_at: order.createdAt.toISOString(),
      price: Number(order.price),
      discount_amount: order.discountAmount ? Number(order.discountAmount) : null,
      tension: order.tension,
      string: order.string
        ? {
            brand: order.string.brand,
            model: order.string.model,
          }
        : null,
    }));
}

/**
 * Fetch all reviews by the current user.
 */
export async function getUserReviews(userId: string) {
  const reviews = await prisma.review.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      order: {
        select: {
          id: true,
          price: true,
          discount: true,
          discountAmount: true,
          string: { select: { brand: true, model: true } },
        },
      },
      user: { select: { id: true, fullName: true, email: true } },
    },
  });

  return reviews.map((review) =>
    mapReviewToApiPayload(review, { includeOrder: true, includeUser: true })
  );
}

/**
 * Fetch a review by order id with access control.
 */
export async function getReviewByOrder(user: { id: string; role?: string | null }, orderId: string) {
  if (!isValidUUID(orderId)) {
    throw new ApiError('BAD_REQUEST', 400, 'Invalid order id');
  }

  if (!isAdminRole(user.role)) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
      select: { id: true },
    });
    if (!order) throw new ApiError('NOT_FOUND', 404, 'Order not found');
  }

  const review = await prisma.review.findUnique({
    where: { orderId },
    include: {
      order: {
        select: {
          id: true,
          price: true,
          discount: true,
          discountAmount: true,
          string: { select: { brand: true, model: true } },
        },
      },
      user: { select: { id: true, fullName: true, email: true } },
    },
  });

  return review
    ? mapReviewToApiPayload(review, { includeOrder: true, includeUser: true })
    : null;
}

/**
 * Fetch featured reviews for the homepage.
 * 优先显示管理员标记的精选评价，然后按点赞数和创建时间排序
 */
export async function getFeaturedReviews() {
  const reviews = await prisma.review.findMany({
    where: { rating: { gte: 4 }, comment: { not: null } },
    orderBy: [
      { isFeatured: 'desc' },  // 精选置顶
      { likesCount: 'desc' },  // 按点赞数排序
      { createdAt: 'desc' },   // 最后按时间排序
    ],
    take: 8,
    include: {
      user: { select: { id: true, fullName: true } },
      order: {
        select: {
          id: true,
          price: true,
          discount: true,
          discountAmount: true,
          string: { select: { brand: true, model: true } },
        },
      },
    },
  });

  const filtered = reviews.filter((review) => String(review.comment || '').trim().length >= 10);
  return filtered.map((review) =>
    mapReviewToApiPayload(review, { includeOrder: true, includeUser: true, maskAnonymousUser: true })
  );
}

function mapPublicReview(review: any) {
  const payload = mapReviewToApiPayload(review, {
    includeOrder: true,
    includeUser: true,
    maskAnonymousUser: true,
  });

  if (payload.user) {
    payload.user.email = null;
  }

  return payload;
}

/**
 * Fetch public reviews for the "View all" page.
 */
export async function getPublicReviews() {
  const reviews = await prisma.review.findMany({
    where: { comment: { not: null } },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      order: {
        select: {
          id: true,
          price: true,
          discount: true,
          discountAmount: true,
          string: { select: { brand: true, model: true } },
        },
      },
    },
  });

  const filtered = reviews.filter((review) => String(review.comment || '').trim().length >= 10);
  return filtered.map(mapPublicReview);
}

/**
 * Fetch public review by id for detail view.
 */
export async function getPublicReviewById(reviewId: string) {
  if (!isValidUUID(reviewId)) {
    throw new ApiError('BAD_REQUEST', 400, 'Invalid review id');
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      order: {
        select: {
          id: true,
          price: true,
          discount: true,
          discountAmount: true,
          string: { select: { brand: true, model: true } },
        },
      },
    },
  });

  if (!review) return null;

  return mapPublicReview(review);
}

/**
 * Admin: fetch all reviews.
 */
export async function getAdminReviews() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      order: {
        select: {
          id: true,
          price: true,
          discount: true,
          discountAmount: true,
          string: { select: { brand: true, model: true } },
        },
      },
    },
  });

  return reviews.map((review) =>
    mapReviewToApiPayload(review, { includeOrder: true, includeUser: true })
  );
}

/**
 * Admin: review stats summary.
 */
export async function getAdminReviewStats() {
  const totalReviews = await prisma.review.count();
  const average = await prisma.review.aggregate({
    _avg: { rating: true, serviceRating: true, qualityRating: true, speedRating: true },
  });

  const ratingGroups = await prisma.review.groupBy({
    by: ['rating'],
    _count: { rating: true },
  });

  const ratingCountMap = ratingGroups.reduce<Record<number, number>>((acc, group) => {
    acc[group.rating] = group._count.rating;
    return acc;
  }, {});

  const averageRating = Number(average._avg.rating || 0);
  const averageService = Number(average._avg.serviceRating || averageRating || 0);
  const averageQuality = Number(average._avg.qualityRating || averageRating || 0);
  const averageSpeed = Number(average._avg.speedRating || averageRating || 0);

  return {
    total_reviews: totalReviews,
    average_rating: averageRating,
    rating_5: ratingCountMap[5] || 0,
    rating_4: ratingCountMap[4] || 0,
    rating_3: ratingCountMap[3] || 0,
    rating_2: ratingCountMap[2] || 0,
    rating_1: ratingCountMap[1] || 0,
    avg_service: averageService,
    avg_quality: averageQuality,
    avg_speed: averageSpeed,
  };
}

/**
 * Admin: reply to a review.
 */
export async function replyReview(adminId: string, reviewId: string, reply: string) {
  const trimmed = String(reply || '').trim();

  if (!trimmed || trimmed.length < 5) {
    throw new ApiError('UNPROCESSABLE_ENTITY', 422, 'Reply must be at least 5 characters');
  }

  const existing = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true },
  });
  if (!existing) {
    throw new ApiError('NOT_FOUND', 404, 'Review not found');
  }

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: {
      adminReply: trimmed,
      adminReplyAt: new Date(),
      adminReplyBy: adminId,
    },
  });

  return {
    id: updated.id,
    admin_reply: updated.adminReply,
    admin_reply_at: updated.adminReplyAt?.toISOString() || null,
    admin_reply_by: updated.adminReplyBy || null,
  };
}

/**
 * Toggle like on a review (点赞/取消点赞)
 */
export async function toggleReviewLike(userId: string, reviewId: string) {
  if (!isValidUUID(reviewId)) {
    throw new ApiError('BAD_REQUEST', 400, 'Invalid review id');
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, likesCount: true },
  });
  if (!review) {
    throw new ApiError('NOT_FOUND', 404, 'Review not found');
  }

  // 检查是否已点赞
  const existingLike = await prisma.reviewLike.findUnique({
    where: { reviewId_userId: { reviewId, userId } },
  });

  if (existingLike) {
    // 取消点赞
    await prisma.$transaction([
      prisma.reviewLike.delete({
        where: { id: existingLike.id },
      }),
      prisma.review.update({
        where: { id: reviewId },
        data: { likesCount: { decrement: 1 } },
      }),
    ]);
    return { liked: false, likesCount: Math.max(0, review.likesCount - 1) };
  } else {
    // 添加点赞
    await prisma.$transaction([
      prisma.reviewLike.create({
        data: { reviewId, userId },
      }),
      prisma.review.update({
        where: { id: reviewId },
        data: { likesCount: { increment: 1 } },
      }),
    ]);
    return { liked: true, likesCount: review.likesCount + 1 };
  }
}

/**
 * Check if user has liked a review
 */
export async function hasUserLikedReview(userId: string, reviewId: string): Promise<boolean> {
  const like = await prisma.reviewLike.findUnique({
    where: { reviewId_userId: { reviewId, userId } },
    select: { id: true },
  });
  return !!like;
}

/**
 * Get user's liked review IDs (for batch checking)
 */
export async function getUserLikedReviewIds(userId: string, reviewIds: string[]): Promise<Set<string>> {
  const likes = await prisma.reviewLike.findMany({
    where: { userId, reviewId: { in: reviewIds } },
    select: { reviewId: true },
  });
  return new Set(likes.map((l) => l.reviewId));
}

/**
 * Admin: toggle featured status on a review (精选/取消精选)
 */
export async function toggleReviewFeatured(reviewId: string) {
  if (!isValidUUID(reviewId)) {
    throw new ApiError('BAD_REQUEST', 400, 'Invalid review id');
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, isFeatured: true },
  });
  if (!review) {
    throw new ApiError('NOT_FOUND', 404, 'Review not found');
  }

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: { isFeatured: !review.isFeatured },
  });

  return { isFeatured: updated.isFeatured };
}

