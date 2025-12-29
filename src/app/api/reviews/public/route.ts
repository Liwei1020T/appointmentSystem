/**
 * Public reviews API
 * GET /api/reviews/public
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { okResponse, failResponse } from '@/lib/api-response';
import { getPublicReviews } from '@/server/services/review.service';
import { handleApiError } from '@/lib/api/handleApiError';

const querySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).optional(),
  page: z.coerce.number().int().positive().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const query = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!query.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid query parameters', 422, query.error.flatten());
    }

    const reviews = await getPublicReviews();
    return okResponse(reviews);
  } catch (error) {
    return handleApiError(error);
  }
}
