/**
 * Package purchase API
 * POST /api/packages/buy
 */

import { z } from 'zod';
import { requireAuth } from '@/lib/server-auth';
import { failResponse, okResponse } from '@/lib/api-response';
import { buyPackage } from '@/server/services/package.service';
import { handleApiError } from '@/lib/api/handleApiError';
import { financialLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  packageId: z.string().uuid(),
  paymentMethod: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await requireAuth();

    // 财务操作速率限制：防止套餐购买滥用
    const clientIp = getClientIp(request);
    const rateLimitKey = `package-buy:${user.id}:${clientIp}`;
    const rateLimitResult = financialLimiter.check(rateLimitKey);
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult.resetAt);
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch (error) {
      return handleApiError(error);
    }

    const parsedBody = bodySchema.safeParse(body);
    if (!parsedBody.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Validation failed', 422, parsedBody.error.flatten());
    }

    const result = await buyPackage(user, parsedBody.data);
    return okResponse(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
