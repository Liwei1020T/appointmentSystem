/**
 * System stats API
 * GET /api/stats
 *
 * NOTE: 此端点需要认证，防止公开暴露业务数据（收入、用户数等）
 */
import { okResponse } from '@/lib/api-response';
import { getSystemStats } from '@/server/services/stats.service';
import { handleApiError } from '@/lib/api/handleApiError';
import { requireAuth } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    await requireAuth();
    const stats = await getSystemStats();
    return okResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
