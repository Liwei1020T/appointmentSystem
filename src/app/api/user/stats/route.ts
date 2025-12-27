/**
 * User stats API
 * GET /api/user/stats
 */

import { requireUser } from '@/lib/server-auth';
import { okResponse, failResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { getUserStats } from '@/server/services/profile.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireUser();
    const stats = await getUserStats(user.id);
    return okResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
