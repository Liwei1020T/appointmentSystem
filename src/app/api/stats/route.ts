/**
 * System stats API
 * GET /api/stats
 */

import { okResponse, failResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { getSystemStats } from '@/server/services/stats.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getSystemStats();
    return okResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
