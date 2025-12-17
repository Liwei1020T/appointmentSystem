import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(_request: NextRequest) {
  try {
    await requireAdmin();
    return successResponse({
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      ordersByDay: [],
      averageCompletionTime: 0,
    });
  } catch (error: any) {
    console.error('Order trends error:', error);
    return errorResponse(error.message || 'Failed to fetch order trends', 500);
  }
}
