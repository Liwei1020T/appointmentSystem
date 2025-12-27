/**
 * Packages API
 * GET /api/packages
 */

import { failResponse, okResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { listAvailablePackages } from '@/server/services/package.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const packages = await listAvailablePackages();
    return okResponse(packages);
  } catch (error) {
    return handleApiError(error);
  }
}
