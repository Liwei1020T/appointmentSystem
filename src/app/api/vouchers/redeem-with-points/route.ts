import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/server-auth';
import { parseJson } from '@/lib/validation';
import { okResponse, failResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { isValidUUID } from '@/lib/utils';
import { redeemVoucherWithPoints } from '@/server/services/voucher.service';

const bodySchema = z.object({
  voucherId: z.string().trim().min(1),
  points: z.coerce.number().int().positive().optional(),
});

/**
 * Redeem voucher with points API
 * POST /api/vouchers/redeem-with-points
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

    if (!isValidUUID(parsed.data.voucherId)) {
      return failResponse('BAD_REQUEST', 'Invalid voucher id', 400);
    }

    const result = await redeemVoucherWithPoints(user.id, parsed.data.voucherId, parsed.data.points);
    return okResponse(result);
  } catch (error: any) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    return failResponse('INTERNAL_ERROR', 'Failed to redeem voucher', 500);
  }
}
