/**
 * 库存变动日志 API
 * GET /api/admin/inventory/[id]/logs - 获取库存变动记录
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const logs = await prisma.stockLog.findMany({
      where: { stringId: params.id },
      orderBy: { createdAt: 'desc' },
      include: {
        createdByUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('Get stock logs error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stock logs' },
      { status: 500 }
    );
  }
}
