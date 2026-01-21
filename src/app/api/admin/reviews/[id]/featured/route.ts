/**
 * 管理员：评价精选 API
 * POST /api/admin/reviews/[id]/featured - 切换精选状态
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { okResponse, failResponse } from '@/lib/api-response';
import { toggleReviewFeatured } from '@/server/services/review.service';
import { handleApiError } from '@/lib/api/handleApiError';
import { isAdminRole } from '@/lib/roles';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return failResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    if (!isAdminRole(session.user.role)) {
      return failResponse('FORBIDDEN', 'Admin access required', 403);
    }

    const { id: reviewId } = await params;
    const result = await toggleReviewFeatured(reviewId);

    return okResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
