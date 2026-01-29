/**
 * User pending package payments API
 * GET /api/packages/pending-payments
 */
import { requireAuth } from '@/lib/server-auth';
import { okResponse } from '@/lib/api-response';
import { listPendingPackagePayments } from '@/server/services/package.service';
import { handleApiError } from '@/lib/api/handleApiError';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const user = await requireAuth();
    const payments = await listPendingPackagePayments(user.id);
    return okResponse(payments);
  } catch (error) {
    return handleApiError(error);
  }
}
