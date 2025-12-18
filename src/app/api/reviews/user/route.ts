import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { mapReviewToApiPayload } from '@/lib/review-mapper';

/**
 * GET /api/reviews/user
 * Returns current user's reviews
 */
export async function GET(_request: NextRequest) {
  try {
    let user;
    try {
      user = await requireAuth();
    } catch (error: any) {
      if (error?.json) return error.json();
      return errorResponse('未登录', 401);
    }

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
        user: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    const payload = reviews.map((review) => mapReviewToApiPayload(review, { includeOrder: true, includeUser: true }));
    return successResponse({ reviews: payload });
  } catch (error: any) {
    console.error('Get user reviews error:', error);
    return errorResponse(error.message || '获取评价失败', 500);
  }
}
