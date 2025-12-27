/**
 * Featured reviews API
 * GET /api/reviews/featured
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { okResponse, failResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { getFeaturedReviews } from '@/server/services/review.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  limit: z.coerce.number().int().positive().max(20).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const query = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!query.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid query parameters', 422, query.error.flatten());
    }

    const reviews = await getFeaturedReviews();
    const limit = query.data.limit ?? 6;
    return okResponse(reviews.slice(0, limit));
  } catch (error) {
    return handleApiError(error);
  }
}
