import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server-auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { isValidUUID } from '@/lib/utils';
import { mapReviewToApiPayload } from '@/lib/review-mapper';

/**
 * GET /api/reviews/order/[orderId]
 * Fetch a single order review (owner or admin)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;
    if (!orderId) return errorResponse('缺少订单ID', 400);
    if (!isValidUUID(orderId)) return errorResponse('无效的订单ID', 400);

    let user;
    try {
      user = await requireAuth();
    } catch (error: any) {
      if (error?.json) return error.json();
      return errorResponse('未登录', 401);
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
    console.error('Get order review error:', error);
    return errorResponse(error.message || '获取评价失败', 500);
  }
}
