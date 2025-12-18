import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { mapReviewToApiPayload } from '@/lib/review-mapper';

export async function GET() {
  try {
    await requireAdmin();

    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            price: true,
            discount: true,
            discountAmount: true,
            string: {
              select: {
                brand: true,
                model: true,
              },
            },
          },
        },
      },
    });

    const payload = reviews.map((review) => mapReviewToApiPayload(review, { includeOrder: true, includeUser: true }));

    return successResponse(payload);
  } catch (error: any) {
    console.error('Get admin reviews error:', error);
    return errorResponse(error.message || '获取评价失败', 500);
  }
}
