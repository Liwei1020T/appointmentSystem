import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/server-auth';
import { parseJson } from '@/lib/validation';
import { okResponse, failResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { submitReview } from '@/server/services/review.service';

const bodySchema = z
  .object({
    orderId: z.string().trim().optional(),
    order_id: z.string().trim().optional(),
    rating: z.number().min(1).max(5),
    serviceRating: z.number().min(1).max(5).optional(),
    service_rating: z.number().min(1).max(5).optional(),
    qualityRating: z.number().min(1).max(5).optional(),
    quality_rating: z.number().min(1).max(5).optional(),
    speedRating: z.number().min(1).max(5).optional(),
    speed_rating: z.number().min(1).max(5).optional(),
    comment: z.string().trim().min(10),
    tags: z.array(z.string()).optional(),
    images: z.array(z.string()).optional(),
    image_urls: z.array(z.string()).optional(),
    imageUrls: z.array(z.string()).optional(),
    photos: z.array(z.string()).optional(),
    isAnonymous: z.boolean().optional(),
    is_anonymous: z.boolean().optional(),
  })
  .refine((data) => Boolean(data.orderId || data.order_id), {
    message: 'orderId is required',
    path: ['orderId'],
  });

/**
 * Submit review API
 * POST /api/reviews
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = await parseJson(request, bodySchema);
    if (!parsed.ok) {
      if (parsed.type === 'invalid_json') {
        return failResponse('BAD_REQUEST', 'Invalid JSON body', 400);
      }
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid request body', 422, parsed.error.flatten());
    }

    const review = await submitReview(user.id, parsed.data);
    return okResponse(review);
  } catch (error: any) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    return failResponse('INTERNAL_ERROR', 'Failed to submit review', 500);
  }
}
