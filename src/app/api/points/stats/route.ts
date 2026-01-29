import { requireUser } from '@/lib/server-auth';
import { okResponse } from '@/lib/api-response';
import { getPointsStats } from '@/server/services/points.service';
import { handleApiError } from '@/lib/api/handleApiError';
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
  } catch (error) {
    return handleApiError(error);
  }
}
