/**
 * 获取单个球线详情 API
 * GET /api/inventory/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const stringItem = await prisma.stringInventory.findUnique({
      where: { id: params.id },
    });

    if (!stringItem) {
      return NextResponse.json(
        { error: 'String not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(stringItem);
  } catch (error: any) {
    console.error('Get string error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch string' },
      { status: 500 }
    );
  }
}
