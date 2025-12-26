import { requireAdmin } from '@/lib/server-auth';
import { okResponse, failResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { getAdminStats } from '@/server/services/stats.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    const stats = await getAdminStats();
    return okResponse(stats);
  } catch (error: any) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    return failResponse('INTERNAL_ERROR', 'Failed to fetch stats', 500);
  }
}
