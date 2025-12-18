import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { mapReviewToApiPayload } from '@/lib/review-mapper';

/**
 * GET /api/reviews/featured
 * Returns featured reviews for the homepage
 */
export async function GET(_request: NextRequest) {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        rating: { gte: 4 },
        comment: { not: null },
      },
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
    const payload = filtered.map((review) =>
      mapReviewToApiPayload(review, { includeOrder: true, includeUser: true, maskAnonymousUser: true })
    );

    return successResponse(payload);
  } catch (error: any) {
    console.error('Featured reviews error:', error);
    return errorResponse(error.message || '获取精选评价失败', 500);
  }
}
