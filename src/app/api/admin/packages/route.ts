/**
 * 管理员 - 创建套餐 API
 * POST /api/admin/packages
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

/**
 * 获取套餐列表
 * 支持查询参数:
 * - status: active | inactive | all (default all)
 * - search: 模糊搜索名称/描述
 * - includeInactive: boolean (default true)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    const includeInactive = searchParams.get('includeInactive') !== 'false';

    const where: any = {};
    if (status === 'active') where.active = true;
    if (status === 'inactive') where.active = false;
    if (!includeInactive) where.active = true;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const packages = await prisma.package.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    /**
     * 兼容字段命名：
     * - Prisma 模型字段为 camelCase（validityDays/createdAt/updatedAt）
     * - 部分前端页面与旧接口仍读取 snake_case（validity_days/created_at/updated_at）
     */
    const normalized = packages.map((pkg) => ({
      ...pkg,
      validity_days: (pkg as any).validityDays,
      created_at: (pkg as any).createdAt,
      updated_at: (pkg as any).updatedAt,
    }));

    return successResponse(normalized);
  } catch (error: any) {
    console.error('Get packages error:', error);
    return errorResponse(error.message || '获取套餐失败', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    
    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return errorResponse('请求体不能为空');
    }

    const { name, description, times, price, validityDays, validity_days } = body as any;
    const resolvedValidityDays = validityDays ?? validity_days;

    if (!name || !times || !price || !resolvedValidityDays) {
      return errorResponse('请提供套餐名称、次数、价格和有效期');
    }

    const pkg = await prisma.package.create({
      data: {
        name,
        description: description || '',
        times,
        price,
        validityDays: resolvedValidityDays,
        active: true,
      },
    });

    return successResponse(pkg, '套餐创建成功');
  } catch (error: any) {
    console.error('Create package error:', error);
    return errorResponse(error.message || '创建套餐失败', 500);
  }
}

/**
 * 管理员 - 更新套餐 API
 * PATCH /api/admin/packages
 */
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    
    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return errorResponse('请求体不能为空');
    }

    const { id, name, description, times, price, validityDays, validity_days, active } = body as any;
    const resolvedValidityDays = validityDays ?? validity_days;

    if (!id) {
      return errorResponse('请提供套餐ID');
    }

    const pkg = await prisma.package.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(times !== undefined && { times }),
        ...(price !== undefined && { price }),
        ...(resolvedValidityDays !== undefined && { validityDays: resolvedValidityDays }),
        ...(active !== undefined && { active }),
      },
    });

    return successResponse(pkg, '套餐更新成功');
  } catch (error: any) {
    console.error('Update package error:', error);
    return errorResponse(error.message || '更新套餐失败', 500);
  }
}
