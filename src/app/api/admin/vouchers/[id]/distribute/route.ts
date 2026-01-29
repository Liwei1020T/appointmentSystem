import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { isValidUUID } from '@/lib/utils';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

/**
 * Admin - Distribute voucher
 * POST /api/admin/vouchers/[id]/distribute
 *
 * Supports body formats:
 * - { type: 'all' }
 * - { type: 'specific', userIds: string[] }
 * - { type: 'tier', tier: string } (not supported yet)
 * - { userIds: string[] } (legacy)
 *
 * Business rules:
 * - Only admin can distribute
 * - Only distribute within voucher valid window and active=true
 * - One active (unexpired) voucher per user; existing active vouchers are skipped
 * - Respect maxUses by issuing up to remaining slots; extra recipients are skipped
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const voucherId = params.id;
    if (!voucherId) {
      return errorResponse('缺少优惠券ID');
    }
    if (!isValidUUID(voucherId)) {
      return errorResponse('无效的优惠券ID', 400);
    }

    // Parse body safely (may be empty)
    const rawBody = await request.json().catch(() => ({}));
    const body =
      typeof rawBody === 'object' && rawBody !== null
        ? (rawBody as { type?: string; userIds?: unknown })
        : {};

    const targetType: string =
      body.type || (Array.isArray(body.userIds) ? 'specific' : 'all');

    const voucher = await prisma.voucher.findUnique({
      where: { id: voucherId },
      select: {
        id: true,
        name: true,
        active: true,
        validFrom: true,
        validUntil: true,
        maxUses: true,
        usedCount: true,
      },
    });

    if (!voucher) {
      return errorResponse('优惠券不存在', 404);
    }

    const now = new Date();
    if (!voucher.active) {
      return errorResponse('优惠券已失效', 400);
    }
    if (now < new Date(voucher.validFrom) || now > new Date(voucher.validUntil)) {
      return errorResponse('优惠券不在有效期内', 400);
    }

    // Resolve target user IDs
    let targetUserIds: string[] = [];
    if (targetType === 'tier') {
      return errorResponse('暂不支持按等级分发（tier）', 400);
    }
    if (targetType === 'all') {
      const users = await prisma.user.findMany({
        where: {
          role: { notIn: ['admin', 'super_admin'] },
        },
        select: { id: true },
      });
      targetUserIds = users.map((u) => u.id);
    } else {
      const rawUserIds: unknown = body.userIds;
      targetUserIds = Array.isArray(rawUserIds)
        ? rawUserIds.filter((id) => typeof id === 'string')
        : [];
    }

    const uniqueUserIds = Array.from(
      new Set(targetUserIds.filter((id) => isValidUUID(id)))
    );

    if (uniqueUserIds.length === 0) {
      return successResponse(
        { voucherId, count: 0, distributed: 0, skipped: 0, sample: [] },
        '没有可分发的用户'
      );
    }

    // Skip users who already have an active, unexpired copy of this voucher.
    const existingActive = await prisma.userVoucher.findMany({
      where: {
        voucherId,
        userId: { in: uniqueUserIds },
        status: 'active',
        expiry: { gt: now },
      },
      select: { userId: true },
    });
    const existingSet = new Set(existingActive.map((uv) => uv.userId));
    const candidates = uniqueUserIds.filter((id) => !existingSet.has(id));

    // Enforce maxUses using voucher.usedCount (issued count).
    const remainingSlots =
      voucher.maxUses !== null && voucher.maxUses !== undefined
        ? Math.max(voucher.maxUses - voucher.usedCount, 0)
        : null;

    const limitedCandidates =
      remainingSlots === null ? candidates : candidates.slice(0, remainingSlots);

    if (remainingSlots !== null && remainingSlots <= 0) {
      return errorResponse('优惠券已被领完', 400);
    }

    if (limitedCandidates.length === 0) {
      return successResponse(
        {
          voucherId,
          count: 0,
          distributed: 0,
          skipped: uniqueUserIds.length,
          sample: [],
        },
        '用户已拥有该优惠券或已达到最大领取次数'
      );
    }

    const expiry = new Date(voucher.validUntil);

    const distributedCount = await prisma.$transaction(async (tx) => {
      const created = await tx.userVoucher.createMany({
        data: limitedCandidates.map((userId) => ({
          userId,
          voucherId,
          status: 'active',
          expiry,
        })),
      });

      await tx.voucher.update({
        where: { id: voucherId },
        data: { usedCount: { increment: created.count } },
      });

      return created.count;
    });

    const skipped = uniqueUserIds.length - distributedCount;

    return successResponse(
      {
        voucherId,
        voucherName: voucher.name,
        count: distributedCount,
        distributed: distributedCount,
        skipped: Math.max(skipped, 0),
        sample: limitedCandidates.slice(0, 10),
      },
      '优惠券已分发'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
