/**
 * 获取球线库存列表 API
 * GET /api/inventory
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('active') !== 'false';

    const inventory = await prisma.stringInventory.findMany({
      where: activeOnly ? { active: true } : {},
      orderBy: [
        { brand: 'asc' },
        { model: 'asc' },
      ],
    });

    return successResponse(inventory);
  } catch (error: any) {
    console.error('Get inventory error:', error);
    return errorResponse(error.message || '获取库存失败', 500);
  }
}
