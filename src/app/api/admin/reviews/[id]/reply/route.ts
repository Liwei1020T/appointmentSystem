import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/server-auth';
import { parseJson } from '@/lib/validation';
import { okResponse, failResponse } from '@/lib/api-response';
import { isValidUUID } from '@/lib/utils';
import { replyReview } from '@/server/services/review.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  reply: z.string().trim().min(5).max(1000),
});

/**
 * Admin review reply API
 * POST /api/admin/reviews/:id/reply
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const reviewId = params?.id;
    if (!isValidUUID(reviewId)) {
      return failResponse('BAD_REQUEST', 'Invalid review id', 400);
    }

    const parsed = await parseJson(request, bodySchema);
    if (!parsed.ok) {
      if (parsed.type === 'invalid_json') {
        return failResponse('BAD_REQUEST', 'Invalid JSON body', 400);
      }
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid request body', 422, parsed.error.flatten());
    }

    const result = await replyReview(admin.id, reviewId, parsed.data.reply);
    return okResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
