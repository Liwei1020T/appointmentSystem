/**
 * 管理员 - 创建优惠券 API
 * POST /api/admin/vouchers
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    
    const body = await request.json();
    const {
      code,
      name,
      description,
      type,
      value,
      validFrom,
      validUntil,
      minOrderAmount,
      maxUses,
      pointsCost,
    } = body;

    if (!code || !name || !type || !value || !validFrom || !validUntil) {
      return errorResponse('请提供必填字段');
    }

    // 检查优惠券代码是否已存在
    const existing = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existing) {
      return errorResponse('优惠券代码已存在');
    }

    const voucher = await prisma.voucher.create({
      data: {
        code: code.toUpperCase(),
        name,
        type,
        value,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        minPurchase: minOrderAmount || 0,
        maxUses: maxUses || null,
        usedCount: 0,
        pointsCost: pointsCost || 0,
        active: true,
      },
    });

    return successResponse(voucher, '优惠券创建成功');
  } catch (error: any) {
    console.error('Create voucher error:', error);
    return errorResponse(error.message || '创建优惠券失败', 500);
  }
}

/**
 * 管理员 - 获取所有优惠券 API
 * GET /api/admin/vouchers
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    
    const searchParams = request.nextUrl.searchParams;
    const active = searchParams.get('active');

    const where: any = {};
    if (active !== null) {
      where.active = active === 'true';
    }

    const vouchers = await prisma.voucher.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return successResponse(vouchers);
  } catch (error: any) {
    console.error('Get vouchers error:', error);
    return errorResponse(error.message || '获取优惠券失败', 500);
  }
}

/**
 * 管理员 - 更新优惠券 API
 * PATCH /api/admin/vouchers
 */
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    
    const body = await request.json();
    const { id, active, maxUses } = body;

    if (!id) {
      return errorResponse('请提供优惠券ID');
    }

    const voucher = await prisma.voucher.update({
      where: { id },
      data: {
        ...(active !== undefined && { active }),
        ...(maxUses !== undefined && { maxUses }),
      },
    });

    return successResponse(voucher, '优惠券更新成功');
  } catch (error: any) {
    console.error('Update voucher error:', error);
    return errorResponse(error.message || '更新优惠券失败', 500);
  }
}
