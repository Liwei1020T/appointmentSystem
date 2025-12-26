/**
 * System stats API
 * GET /api/stats
 */

import { okResponse, failResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { getSystemStats } from '@/server/services/stats.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getSystemStats();
    return okResponse(stats);
  } catch (error: any) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    return failResponse('INTERNAL_ERROR', 'Failed to fetch stats', 500);
  }
}
