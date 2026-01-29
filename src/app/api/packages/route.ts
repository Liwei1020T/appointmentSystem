/**
 * Packages API
 * GET /api/packages
 */
import { okResponse } from '@/lib/api-response';
import { listAvailablePackages } from '@/server/services/package.service';
import { handleApiError } from '@/lib/api/handleApiError';
import { getCurrentUser } from '@/lib/server-auth';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const user = await getCurrentUser();
    const packages = await listAvailablePackages(user?.id);
    return okResponse(packages);
  } catch (error) {
    return handleApiError(error);
  }
}
