/**
 * User pending package payments API
 * GET /api/packages/pending-payments
 */

import { requireAuth } from '@/lib/server-auth';
import { failResponse, okResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { listPendingPackagePayments } from '@/server/services/package.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requireAuth();
    const payments = await listPendingPackagePayments(user.id);
    return okResponse(payments);
  } catch (error) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    console.error('Get pending package payments error:', error);
    return failResponse('INTERNAL_ERROR', 'Failed to fetch pending package payments', 500);
  }
}
