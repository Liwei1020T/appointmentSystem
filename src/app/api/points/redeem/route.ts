import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/server-auth';
import { parseJson } from '@/lib/validation';
import { okResponse, failResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { redeemPoints } from '@/server/services/points.service';
import { handleApiError } from '@/lib/api/handleApiError';

const bodySchema = z.object({
  points: z.coerce.number().int().positive(),
  reason: z.string().trim().max(200).optional(),
});

/**
 * Redeem points API
 * POST /api/points/redeem
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

    const result = await redeemPoints(user.id, parsed.data.points, parsed.data.reason);
    return okResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
