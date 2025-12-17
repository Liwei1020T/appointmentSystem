import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

/**
 * GET /api/admin/packages/sales
 * 返回套餐销售数据（当前无历史数据，返回空数组以避免前端报错）
 */
export async function GET(_request: NextRequest) {
  try {
    await requireAdmin();
    return successResponse([]);
  } catch (error: any) {
    console.error('Get package sales error:', error);
    return errorResponse(error.message || '获取套餐销售数据失败', 500);
  }
}
