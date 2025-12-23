'use server';

import { prisma } from '@/lib/prisma';
import { requireAdmin, requireAuth } from '@/lib/server-auth';
import { isValidUUID } from '@/lib/utils';
import { mapReviewToApiPayload } from '@/lib/review-mapper';

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

export async function submitReviewAction(body: any) {
  const user = await requireAuth();
  const orderId: string = body.order_id || body.orderId;
  const rating = parseRating(body.rating, 0);
  const comment = String(body.comment ?? '').trim();

  if (!isValidUUID(orderId)) {
    throw new Error('无效的订单ID');
  }

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new Error('评分必须为 1-5');
  }

  if (comment.length < 10) {
    throw new Error('评价内容至少需要 10 个字');
  }

  const photos = parseStringArray(body.images ?? body.image_urls ?? body.imageUrls ?? body.photos);
  const tags = parseStringArray(body.tags);
  const isAnonymous = Boolean(body.is_anonymous ?? body.isAnonymous ?? false);

  const serviceRating = parseRating(body.service_rating ?? body.serviceRating, rating);
  const qualityRating = parseRating(body.quality_rating ?? body.qualityRating, rating);
  const speedRating = parseRating(body.speed_rating ?? body.speedRating, rating);

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
    select: { id: true, status: true },
  });

  if (!order) {
    throw new Error('订单不存在');
  }

  if (order.status !== 'completed') {
    throw new Error('订单未完成，暂不可评价');
  }

  const existing = await prisma.review.findUnique({
    where: { orderId },
    select: { id: true },
  });
  if (existing) {
    throw new Error('该订单已评价');
  }

  const created = await prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        orderId,
        userId: user.id,
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
      where: { id: user.id },
      data: { points: { increment: REVIEW_REWARD_POINTS } },
      select: { points: true },
    });

    await tx.pointsLog.create({
      data: {
        userId: user.id,
        amount: REVIEW_REWARD_POINTS,
        type: 'review',
        referenceId: orderId,
        description: '评价奖励',
        balanceAfter: updatedUser.points,
      },
    });

    return review;
  });

  return mapReviewToApiPayload(created, { includeOrder: true, includeUser: true });
}

/**
 * 获取待评价订单（已完成但未评价的订单）
 */
export async function getPendingReviewOrdersAction() {
  const user = await requireAuth();

  // 获取已完成的订单
  const completedOrders = await prisma.order.findMany({
    where: {
      userId: user.id,
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

  // 获取用户已评价的订单ID列表
  const reviewedOrderIds = await prisma.review.findMany({
    where: { userId: user.id },
    select: { orderId: true },
  });
  const reviewedSet = new Set(reviewedOrderIds.map((r) => r.orderId));

  // 筛选出没有评价的订单
  const pendingOrders = completedOrders
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

  return pendingOrders;
}


export async function getUserReviewsAction() {
  const user = await requireAuth();
  const reviews = await prisma.review.findMany({
    where: { userId: user.id },
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

  return reviews.map((review) => mapReviewToApiPayload(review, { includeOrder: true, includeUser: true }));
}

export async function getReviewByOrderAction(orderId: string) {
  const user = await requireAuth();

  if (!isValidUUID(orderId)) {
    throw new Error('无效的订单ID');
  }

  if (user.role !== 'admin') {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
      select: { id: true },
    });
    if (!order) throw new Error('订单不存在');
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

  return review ? mapReviewToApiPayload(review, { includeOrder: true, includeUser: true }) : null;
}

export async function getFeaturedReviewsAction() {
  const reviews = await prisma.review.findMany({
    where: { rating: { gte: 4 }, comment: { not: null } },
    orderBy: { createdAt: 'desc' },
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

export async function getAdminReviewsAction() {
  await requireAdmin();

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

  return reviews.map((review) => mapReviewToApiPayload(review, { includeOrder: true, includeUser: true }));
}

export async function getAdminReviewStatsAction() {
  await requireAdmin();

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

export async function replyReviewAction(reviewId: string, reply: string) {
  const admin = await requireAdmin();
  const trimmed = String(reply || '').trim();

  if (!trimmed || trimmed.length < 5) {
    throw new Error('回复内容至少需要 5 个字');
  }

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: {
      adminReply: trimmed,
      adminReplyAt: new Date(),
      adminReplyBy: admin.id,
    },
  });

  return {
    id: updated.id,
    admin_reply: updated.adminReply,
    admin_reply_at: updated.adminReplyAt?.toISOString() || null,
    admin_reply_by: updated.adminReplyBy || null,
  };
}
