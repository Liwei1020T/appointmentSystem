import { requireAdmin } from '@/lib/server-auth';
import { okResponse, failResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { getAdminStats } from '@/server/services/stats.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    const stats = await getAdminStats();
    return okResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
