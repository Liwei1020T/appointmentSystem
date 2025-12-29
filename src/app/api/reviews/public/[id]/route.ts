/**
 * Public review detail API
 * GET /api/reviews/public/[id]
 */

import { NextRequest } from 'next/server';
import { notFoundResponse, okResponse } from '@/lib/api-response';
import { getPublicReviewById } from '@/server/services/review.service';
import { handleApiError } from '@/lib/api/handleApiError';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const review = await getPublicReviewById(params.id);
    if (!review) {
      return notFoundResponse('评价不存在');
    }
    return okResponse(review);
  } catch (error) {
    return handleApiError(error);
  }
}
