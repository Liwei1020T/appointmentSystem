/**
 * Public reviews API
 * GET /api/reviews/public
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { okResponse, failResponse } from '@/lib/api-response';
import { getPublicReviews } from '@/server/services/review.service';
import { handleApiError } from '@/lib/api/handleApiError';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).optional().default(10),
  page: z.coerce.number().int().positive().optional().default(1),
  sort: z.enum(['latest', 'rating', 'likes']).optional().default('latest'),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const query = querySchema.safeParse(params);
    if (!query.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid query parameters', 422, query.error.flatten());
    }

    // Get current user for isLiked field
    const session = await auth();
    const userId = session?.user?.id;

    const result = await getPublicReviews({
      sort: query.data.sort,
      rating: query.data.rating,
      page: query.data.page,
      limit: query.data.limit,
      userId,
    });

    return okResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
