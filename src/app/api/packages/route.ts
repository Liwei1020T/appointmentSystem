/**
 * Packages API
 * GET /api/packages
 */

import { failResponse, okResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { listAvailablePackages } from '@/server/services/package.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const packages = await listAvailablePackages();
    return okResponse(packages);
  } catch (error) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    console.error('Get packages error:', error);
    return failResponse('INTERNAL_ERROR', 'Failed to fetch packages', 500);
  }
}
