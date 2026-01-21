/**
 * 库存补货建议 API
 * GET /api/admin/inventory/restock - 获取智能补货建议
 */

import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';
import { successResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api/handleApiError';
import { getRestockSuggestions, getLowStockAlerts } from '@/server/services/restock.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const url = new URL(request.url);
    const alertsOnly = url.searchParams.get('alerts') === 'true';

    if (alertsOnly) {
      const alerts = await getLowStockAlerts();
      return successResponse(alerts);
    }

    const suggestions = await getRestockSuggestions();
    return successResponse(suggestions);
  } catch (error) {
    return handleApiError(error);
  }
}
