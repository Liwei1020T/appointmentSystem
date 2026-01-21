/**
 * 业务洞察 API
 * GET /api/admin/analytics - 获取仪表盘数据
 */

import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';
import { successResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api/handleApiError';
import { getDashboardStats } from '@/server/services/analytics.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const stats = await getDashboardStats();

    return successResponse(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
