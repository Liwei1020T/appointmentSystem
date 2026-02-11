/**
 * 管理员 - 创建优惠券 API
 * POST /api/admin/vouchers
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api/handleApiError';
import { parseValidityDays } from '@/lib/voucher-utils';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

const createVoucherSchema = z
  .object({
    code: z.string().trim().min(1, '请提供优惠券代码').max(50).transform((s) => s.toUpperCase()),
    name: z.string().trim().min(1, '请提供优惠券名称').max(100),
    type: z.enum(['fixed_amount', 'percentage'], { errorMap: () => ({ message: '类型必须为 fixed_amount 或 percentage' }) }),
    value: z.coerce.number().positive('优惠值必须大于 0'),
    validFrom: z.union([z.string(), z.date()]).pipe(z.coerce.date()),
    valid_from: z.union([z.string(), z.date()]).pipe(z.coerce.date()).optional(),
    validUntil: z.union([z.string(), z.date()]).pipe(z.coerce.date()),
    valid_until: z.union([z.string(), z.date()]).pipe(z.coerce.date()).optional(),
    minOrderAmount: z.coerce.number().min(0).default(0),
    min_purchase: z.coerce.number().min(0).optional(),
    maxUses: z.coerce.number().int().positive().nullable().optional(),
    usage_limit: z.coerce.number().int().positive().nullable().optional(),
    pointsCost: z.coerce.number().int().min(0).default(0),
    points_cost: z.coerce.number().int().min(0).optional(),
    maxRedemptionsPerUser: z.coerce.number().int().min(1).default(1),
    max_redemptions_per_user: z.coerce.number().int().min(1).optional(),
    active: z.boolean().default(true),
    isAutoIssue: z.boolean().default(false),
    is_auto_issue: z.boolean().optional(),
    isFirstOrderOnly: z.boolean().default(false),
    is_first_order_only: z.boolean().optional(),
    validityDays: z.union([z.string(), z.number(), z.null()]).optional(),
    validity_days: z.union([z.string(), z.number(), z.null()]).optional(),
  })
  .transform((data) => ({
    code: data.code,
    name: data.name,
    type: data.type,
    value: data.value,
    validFrom: data.validFrom ?? data.valid_from!,
    validUntil: data.validUntil ?? data.valid_until!,
    minOrderAmount: data.minOrderAmount ?? data.min_purchase ?? 0,
    maxUses: data.maxUses ?? data.usage_limit ?? null,
    pointsCost: data.pointsCost ?? data.points_cost ?? 0,
    maxRedemptionsPerUser: data.maxRedemptionsPerUser ?? data.max_redemptions_per_user ?? 1,
    active: data.active,
    isAutoIssue: data.isAutoIssue ?? data.is_auto_issue ?? false,
    isFirstOrderOnly: data.isFirstOrderOnly ?? data.is_first_order_only ?? false,
    validityDays: parseValidityDays(data.validityDays ?? data.validity_days ?? null),
  }))
  .refine(
    (data) => data.validUntil > data.validFrom,
    { message: '结束日期必须晚于开始日期' }
  )
  .refine(
    (data) => data.type !== 'percentage' || data.value <= 100,
    { message: '百分比折扣不能超过 100' }
  );

const updateVoucherSchema = z
  .object({
    id: z.string().trim().min(1, '请提供优惠券ID'),
    code: z.string().trim().min(1, '优惠券代码不能为空').max(50).optional(),
    name: z.string().trim().min(1, '优惠券名称不能为空').max(100).optional(),
    type: z.enum(['fixed_amount', 'percentage']).optional(),
    value: z.coerce.number().positive('优惠值必须大于 0').optional(),
    validFrom: z.union([z.string(), z.date()]).pipe(z.coerce.date()).optional(),
    valid_from: z.union([z.string(), z.date()]).pipe(z.coerce.date()).optional(),
    validUntil: z.union([z.string(), z.date()]).pipe(z.coerce.date()).optional(),
    valid_until: z.union([z.string(), z.date()]).pipe(z.coerce.date()).optional(),
    minOrderAmount: z.coerce.number().min(0).optional(),
    min_purchase: z.coerce.number().min(0).optional(),
    pointsCost: z.coerce.number().int().min(0).optional(),
    points_cost: z.coerce.number().int().min(0).optional(),
    active: z.boolean().optional(),
    maxUses: z.coerce.number().int().positive().nullable().optional(),
    usage_limit: z.coerce.number().int().positive().nullable().optional(),
    maxRedemptionsPerUser: z.coerce.number().int().min(1).optional(),
    max_redemptions_per_user: z.coerce.number().int().min(1).optional(),
    isAutoIssue: z.boolean().optional(),
    is_auto_issue: z.boolean().optional(),
    isFirstOrderOnly: z.boolean().optional(),
    is_first_order_only: z.boolean().optional(),
    validityDays: z.union([z.string(), z.number(), z.null()]).optional(),
    validity_days: z.union([z.string(), z.number(), z.null()]).optional(),
  })
  .transform((data) => ({
    id: data.id,
    code: data.code?.toUpperCase(),
    name: data.name,
    type: data.type,
    value: data.value,
    validFrom: data.validFrom ?? data.valid_from,
    validUntil: data.validUntil ?? data.valid_until,
    minOrderAmount: data.minOrderAmount ?? data.min_purchase,
    pointsCost: data.pointsCost ?? data.points_cost,
    active: data.active,
    maxUses: data.maxUses ?? data.usage_limit,
    maxRedemptionsPerUser: data.maxRedemptionsPerUser ?? data.max_redemptions_per_user,
    isAutoIssue: data.isAutoIssue ?? data.is_auto_issue,
    isFirstOrderOnly: data.isFirstOrderOnly ?? data.is_first_order_only,
    validityDays:
      data.validityDays !== undefined || data.validity_days !== undefined
        ? parseValidityDays(data.validityDays ?? data.validity_days ?? null)
        : undefined,
  }))
  .refine(
    (data) => !(data.validFrom && data.validUntil) || data.validUntil > data.validFrom,
    { message: '结束日期必须晚于开始日期' }
  )
  .refine(
    (data) => data.type !== 'percentage' || data.value === undefined || data.value <= 100,
    { message: '百分比折扣不能超过 100' }
  );

const deleteVoucherSchema = z.object({
  id: z.string().trim().min(1, '请提供优惠券ID'),
});

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const parsed = createVoucherSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || '请提供必填字段';
      return errorResponse(firstError, 400);
    }

    const data = parsed.data;

    // 检查优惠券代码是否已存在
    const existing = await prisma.voucher.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      return errorResponse('优惠券代码已存在');
    }

    const voucher = await prisma.voucher.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        value: data.value,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        minPurchase: data.minOrderAmount,
        maxUses: data.maxUses,
        usedCount: 0,
        pointsCost: data.pointsCost,
        maxRedemptionsPerUser: data.maxRedemptionsPerUser,
        active: data.active,
        isAutoIssue: data.isAutoIssue,
        isFirstOrderOnly: data.isFirstOrderOnly,
        validityDays: data.validityDays,
      },
    });

    return successResponse(voucher, '优惠券创建成功');
  } catch (error) {
    return handleApiError(error);
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

    const where: Prisma.VoucherWhereInput = {};
    if (id) {
      where.id = id;
    }
    if (active !== null) {
      where.active = active === 'true';
    }

    if (id) {
      const voucher = await prisma.voucher.findFirst({ where });
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
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * 管理员 - 更新优惠券 API
 * PATCH /api/admin/vouchers
 */
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json().catch(() => ({}));
    const parsed = updateVoucherSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message || '无效请求参数', 400);
    }
    const data = parsed.data;

    const updateData: Prisma.VoucherUpdateInput = {};
    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.value !== undefined) updateData.value = data.value;
    if (data.minOrderAmount !== undefined) updateData.minPurchase = data.minOrderAmount;
    if (data.pointsCost !== undefined) updateData.pointsCost = data.pointsCost;
    if (data.validFrom !== undefined) updateData.validFrom = data.validFrom;
    if (data.validUntil !== undefined) updateData.validUntil = data.validUntil;
    if (data.active !== undefined) updateData.active = data.active;
    if (data.maxUses !== undefined) updateData.maxUses = data.maxUses;
    if (data.maxRedemptionsPerUser !== undefined) {
      updateData.maxRedemptionsPerUser = data.maxRedemptionsPerUser;
    }
    if (data.isAutoIssue !== undefined) updateData.isAutoIssue = data.isAutoIssue;
    if (data.isFirstOrderOnly !== undefined) updateData.isFirstOrderOnly = data.isFirstOrderOnly;
    if (data.validityDays !== undefined) updateData.validityDays = data.validityDays;

    if (Object.keys(updateData).length === 0) {
      return errorResponse('没有可更新的字段');
    }

    if (data.code) {
      const existing = await prisma.voucher.findFirst({
        where: {
          code: data.code,
          NOT: { id: data.id },
        },
      });
      if (existing) {
        return errorResponse('优惠券代码已存在');
      }
    }

    const voucher = await prisma.voucher.update({
      where: { id: data.id },
      data: updateData,
    });

    return successResponse(voucher, '优惠券更新成功');
  } catch (error) {
    return handleApiError(error);
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
    const parsed = deleteVoucherSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0]?.message || '请提供优惠券ID', 400);
    }
    const { id } = parsed.data;

    const distributedCount = await prisma.userVoucher.count({
      where: { voucherId: id },
    });

    if (distributedCount > 0) {
      return errorResponse('已分发的优惠券无法删除');
    }

    await prisma.voucher.delete({ where: { id } });
    return successResponse({ id }, '优惠券已删除');
  } catch (error) {
    return handleApiError(error);
  }
}
