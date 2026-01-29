/**
 * 评价点赞 API
 * POST /api/reviews/[id]/like - 点赞/取消点赞
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { okResponse, failResponse } from '@/lib/api-response';
import { toggleReviewLike } from '@/server/services/review.service';
import { handleApiError } from '@/lib/api/handleApiError';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return failResponse('UNAUTHORIZED', 'Authentication required', 401);
    }

    const { id: reviewId } = await params;
    const result = await toggleReviewLike(session.user.id, reviewId);

    return okResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
