import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(_request: NextRequest) {
  try {
    await requireAdmin();
    return successResponse([]);
  } catch (error: any) {
    console.error('Top packages error:', error);
    return errorResponse(error.message || 'Failed to fetch top packages', 500);
  }
}
