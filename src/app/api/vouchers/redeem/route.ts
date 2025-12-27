/**
 * Redeem voucher API
 * POST /api/vouchers/redeem
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/server-auth';
import { parseJson } from '@/lib/validation';
import { okResponse, failResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { redeemVoucherByCode } from '@/server/services/voucher.service';
import { handleApiError } from '@/lib/api/handleApiError';

const bodySchema = z.object({
  code: z.string().trim().min(1),
  usePoints: z.boolean().optional(),
});

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

    const data = await redeemVoucherByCode(user.id, parsed.data.code, Boolean(parsed.data.usePoints));
    return okResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}
