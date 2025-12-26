import { requireUser } from '@/lib/server-auth';
import { okResponse, failResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { getPointsStats } from '@/server/services/points.service';

export const dynamic = 'force-dynamic';

/**
 * Points stats API
 * GET /api/points/stats
 */
export async function GET() {
  try {
    const user = await requireUser();
    const stats = await getPointsStats(user.id);
    return okResponse(stats);
  } catch (error: any) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    return failResponse('INTERNAL_ERROR', 'Failed to fetch points stats', 500);
  }
}
