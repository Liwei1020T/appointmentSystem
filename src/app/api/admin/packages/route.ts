/**
 * 管理员 - 创建套餐 API
 * POST /api/admin/packages
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    
    const body = await request.json();
    const { name, description, times, price, validityDays } = body;

    if (!name || !times || !price || !validityDays) {
      return errorResponse('请提供套餐名称、次数、价格和有效期');
    }

    const pkg = await prisma.package.create({
      data: {
        name,
        description: description || '',
        times,
        price,
        validityDays,
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
    const { id, name, description, times, price, validityDays, active } = body;

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
        ...(validityDays !== undefined && { validityDays }),
        ...(active !== undefined && { active }),
      },
    });

    return successResponse(pkg, '套餐更新成功');
  } catch (error: any) {
    console.error('Update package error:', error);
    return errorResponse(error.message || '更新套餐失败', 500);
  }
}
