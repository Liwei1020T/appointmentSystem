import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { successResponse, errorResponse } from '@/lib/api-response';
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

export async function POST(request: NextRequest) {
  try {
    let user;
    try {
      user = await requireAuth();
    } catch (error: any) {
      if (error?.json) return error.json();
      return errorResponse('未登录', 401);
    }

    const body = await request.json().catch(() => ({}));
    const orderId: string = body.order_id || body.orderId;
    const rating = parseRating(body.rating, 0);
    const comment = String(body.comment ?? '').trim();

    if (!isValidUUID(orderId)) {
      return errorResponse('无效的订单ID', 400);
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return errorResponse('评分必须为 1-5', 400);
    }

    if (comment.length < 10) {
      return errorResponse('评价内容至少需要 10 个字', 400);
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
      return errorResponse('订单不存在', 404);
    }

    if (order.status !== 'completed') {
      return errorResponse('订单未完成，暂不可评价', 400);
    }

    const existing = await prisma.review.findUnique({
      where: { orderId },
      select: { id: true },
    });
    if (existing) {
      return errorResponse('该订单已评价', 400);
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

    const payload = mapReviewToApiPayload(created, { includeOrder: true, includeUser: true });
    return successResponse(payload, `评价成功，已获得 ${REVIEW_REWARD_POINTS} 积分`);
  } catch (error: any) {
    console.error('Submit review error:', error);
    return errorResponse(error.message || '提交评价失败', 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    let user;
    try {
      user = await requireAuth();
    } catch (error: any) {
      if (error?.json) return error.json();
      return errorResponse('未登录', 401);
    }

    const orderId = request.nextUrl.searchParams.get('orderId');
    if (!orderId) {
      return successResponse({ review: null });
    }

    if (!isValidUUID(orderId)) {
      return errorResponse('无效的订单ID', 400);
    }

    if (user.role !== 'admin') {
      const order = await prisma.order.findFirst({
        where: { id: orderId, userId: user.id },
        select: { id: true },
      });
      if (!order) return errorResponse('订单不存在', 404);
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
        user: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    return successResponse({
      review: review ? mapReviewToApiPayload(review, { includeOrder: true, includeUser: true }) : null,
    });
  } catch (error: any) {
    console.error('Get review error:', error);
    return errorResponse(error.message || '获取评价失败', 500);
  }
}
