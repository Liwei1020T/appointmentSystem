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
    const code = body.code?.toString().trim().toUpperCase();
    const name = body.name?.toString().trim() || '';
    const type = body.type;
    const valueNumber = Number(body.value);
    const validFrom = body.validFrom || body.valid_from;
    const validUntil = body.validUntil || body.valid_until;
    const validFromDate = validFrom ? new Date(validFrom) : null;
    const validUntilDate = validUntil ? new Date(validUntil) : null;
    const minOrderAmount = body.minOrderAmount ?? body.min_purchase ?? 0;
    const maxUses = body.maxUses ?? body.usage_limit ?? null;
    const pointsCost = body.pointsCost ?? body.points_cost ?? 0;
    const active = body.active ?? true;

    if (
      !code ||
      !name ||
      !type ||
      !valueNumber ||
      !validFromDate ||
      !validUntilDate ||
      Number.isNaN(valueNumber) ||
      Number.isNaN(validFromDate.getTime()) ||
      Number.isNaN(validUntilDate.getTime())
    ) {
      return errorResponse('请提供必填字段');
    }

    // 检查优惠券代码是否已存在
    const existing = await prisma.voucher.findUnique({
      where: { code },
    });

    if (existing) {
      return errorResponse('优惠券代码已存在');
    }

    const voucher = await prisma.voucher.create({
      data: {
        code,
        name,
        type,
        value: valueNumber,
        validFrom: validFromDate,
        validUntil: validUntilDate,
        minPurchase: minOrderAmount || 0,
        maxUses: maxUses ?? null,
        usedCount: 0,
        pointsCost: pointsCost || 0,
        active,
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
    const id = searchParams.get('id');

    const where: any = {};
    if (id) {
      where.id = id;
    }
    if (active !== null) {
      where.active = active === 'true';
    }

    if (id) {
      const voucher = await prisma.voucher.findUnique({ where });
      if (!voucher) {
        return errorResponse('优惠券不存在', 404);
      }
      return successResponse(voucher);
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
    const id = body.id as string | undefined;
    const code = body.code?.toString().toUpperCase();
    const name = body.name;
    const type = body.type;
    const value = body.value;
    const minOrderAmount = body.minOrderAmount ?? body.min_purchase;
    const pointsCost = body.pointsCost ?? body.points_cost;
    const validFrom = body.validFrom || body.valid_from;
    const validUntil = body.validUntil || body.valid_until;
    const active = body.active;
    const maxUses = body.maxUses ?? body.usage_limit;

    if (!id) {
      return errorResponse('请提供优惠券ID');
    }

    const updateData: any = {};
    if (code) updateData.code = code;
    if (name) updateData.name = name;
    if (type) updateData.type = type;
    if (value !== undefined) {
      const numericValue = Number(value);
      if (Number.isNaN(numericValue)) {
        return errorResponse('优惠值无效');
      }
      updateData.value = numericValue;
    }
    if (minOrderAmount !== undefined) updateData.minPurchase = Number(minOrderAmount);
    if (pointsCost !== undefined) updateData.pointsCost = Number(pointsCost);
    if (validFrom) {
      const parsedValidFrom = new Date(validFrom);
      if (Number.isNaN(parsedValidFrom.getTime())) {
        return errorResponse('开始日期无效');
      }
      updateData.validFrom = parsedValidFrom;
    }
    if (validUntil) {
      const parsedValidUntil = new Date(validUntil);
      if (Number.isNaN(parsedValidUntil.getTime())) {
        return errorResponse('结束日期无效');
      }
      updateData.validUntil = parsedValidUntil;
    }
    if (active !== undefined) updateData.active = active;
    if (maxUses !== undefined) updateData.maxUses = maxUses === null ? null : Number(maxUses);

    if (Object.keys(updateData).length === 0) {
      return errorResponse('没有可更新的字段');
    }

    if (updateData.code) {
      const existing = await prisma.voucher.findFirst({
        where: {
          code: updateData.code,
          NOT: { id },
        },
      });
      if (existing) {
        return errorResponse('优惠券代码已存在');
      }
    }

    const voucher = await prisma.voucher.update({
      where: { id },
      data: updateData,
    });

    return successResponse(voucher, '优惠券更新成功');
  } catch (error: any) {
    console.error('Update voucher error:', error);
    return errorResponse(error.message || '更新优惠券失败', 500);
  }
}

/**
 * 管理员 - 删除优惠券 API
 * DELETE /api/admin/vouchers
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json().catch(() => ({}));
    const id = body.id as string | undefined;

    if (!id) {
      return errorResponse('请提供优惠券ID');
    }

    const distributedCount = await prisma.userVoucher.count({
      where: { voucherId: id },
    });

    if (distributedCount > 0) {
      return errorResponse('已分发的优惠券无法删除');
    }

    await prisma.voucher.delete({ where: { id } });
    return successResponse({ id }, '优惠券已删除');
  } catch (error: any) {
    console.error('Delete voucher error:', error);
    return errorResponse(error.message || '删除优惠券失败', 500);
  }
}
