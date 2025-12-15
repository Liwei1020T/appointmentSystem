/**
 * 管理员 - 库存详情 API
 * GET /api/admin/inventory/[id] - 获取详情
 * PUT /api/admin/inventory/[id] - 更新
 * PATCH /api/admin/inventory/[id] - 部分更新
 * DELETE /api/admin/inventory/[id] - 删除
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

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
    return errorResponse(error.message || 'Failed to fetch string', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const body = await request.json();

    // 支持多种字段命名
    const model = body.name || body.model;
    const brand = body.brand;
    const description = body.description || null;
    const costPrice = body.cost_price || body.costPrice;
    const sellingPrice = body.selling_price || body.sellingPrice;
    const stock = body.stock_quantity ?? body.stock;
    const minimumStock = body.minimum_stock ?? body.minimumStock;
    const color = body.color || null;
    const gauge = body.gauge || null;
    const imageUrl = body.image_url || body.imageUrl || null;
    const active = body.active ?? true;

    const updatedItem = await prisma.stringInventory.update({
      where: { id: params.id },
      data: {
        model,
        brand,
        description,
        costPrice: costPrice ? Number(costPrice) : undefined,
        sellingPrice: sellingPrice ? Number(sellingPrice) : undefined,
        stock: stock !== undefined ? Number(stock) : undefined,
        minimumStock: minimumStock !== undefined ? Number(minimumStock) : undefined,
        color,
        gauge,
        imageUrl,
        active,
      },
    });

    return successResponse(updatedItem, '更新成功');
  } catch (error: any) {
    console.error('Update string error:', error);
    return errorResponse(error.message || '更新失败', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    // 检查是否有关联订单
    const orderCount = await prisma.order.count({
      where: { stringId: params.id },
    });

    if (orderCount > 0) {
      return errorResponse('该球线已有订单记录，无法删除', 400);
    }

    // 删除相关库存日志
    await prisma.stockLog.deleteMany({
      where: { stringId: params.id },
    });

    // 删除球线
    await prisma.stringInventory.delete({
      where: { id: params.id },
    });

    return successResponse({ success: true }, '删除成功');
  } catch (error: any) {
    console.error('Delete string error:', error);
    return errorResponse(error.message || '删除失败', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    
    const stringId = params.id;
    const body = await request.json();
    const {
      brand,
      model,
      stock,
      sellingPrice,
      costPrice,
      active,
      adjustment,
      reason,
    } = body;

    // 如果是库存调整，记录日志
    if (adjustment !== undefined) {
      await prisma.$transaction(async (tx) => {
        // 更新库存
        const updated = await tx.stringInventory.update({
          where: { id: stringId },
          data: {
            stock: { increment: adjustment },
          },
        });

        // 记录库存变更日志
        await tx.stockLog.create({
          data: {
            stringId,
            change: adjustment,
            type: adjustment > 0 ? 'restock' : 'adjustment',
            notes: reason || 'Manual adjustment',
          },
        });
      });
    } else {
      // 普通更新
      await prisma.stringInventory.update({
        where: { id: stringId },
        data: {
          ...(brand && { brand }),
          ...(model && { model }),
          ...(stock !== undefined && { stock }),
          ...(sellingPrice !== undefined && { sellingPrice }),
          ...(costPrice !== undefined && { costPrice }),
          ...(active !== undefined && { active }),
        },
      });
    }

    const updated = await prisma.stringInventory.findUnique({
      where: { id: stringId },
    });

    return successResponse(updated, '库存更新成功');
  } catch (error: any) {
    console.error('Update inventory error:', error);
    return errorResponse(error.message || '更新库存失败', 500);
  }
}
