'use server';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/server-auth';

/**
 * 获取库存列表（Server Action）
 */
export async function getInventoryAction(activeOnly = true) {
  return prisma.stringInventory.findMany({
    where: activeOnly ? { active: true } : {},
    orderBy: [{ brand: 'asc' }, { model: 'asc' }],
  });
}

/**
 * 获取单个库存详情（Server Action）
 */
export async function getInventoryItemAction(id: string) {
  const item = await prisma.stringInventory.findUnique({ where: { id } });
  if (!item) {
    throw new Error('String not found');
  }
  return item;
}

/**
 * Admin: 获取库存列表
 */
export async function getAdminInventoryAction() {
  await requireAdmin();
  return prisma.stringInventory.findMany({ orderBy: { createdAt: 'desc' } });
}

/**
 * Admin: 创建库存
 */
export async function createInventoryItemAction(body: any) {
  await requireAdmin();
  const model = body.name || body.model;
  const brand = body.brand;
  const description = body.description || null;
  const costPrice = body.cost_price || body.costPrice;
  const sellingPrice = body.selling_price || body.sellingPrice;
  const stock = body.stock_quantity ?? body.stock ?? 0;
  const minimumStock = body.minimum_stock ?? body.minimumStock ?? 5;
  const color = body.color || null;
  const gauge = body.gauge || null;
  const imageUrl = body.image_url || body.imageUrl || null;

  if (!model || !brand) {
    throw new Error('球线名称和品牌为必填项');
  }

  if (!costPrice || !sellingPrice) {
    throw new Error('成本价和售价为必填项');
  }

  const newItem = await prisma.stringInventory.create({
    data: {
      model,
      brand,
      description,
      costPrice: Number(costPrice),
      sellingPrice: Number(sellingPrice),
      stock: Number(stock),
      minimumStock: Number(minimumStock),
      color,
      gauge,
      imageUrl,
      active: true,
    },
  });

  if (stock > 0) {
    await prisma.stockLog.create({
      data: {
        stringId: newItem.id,
        change: Number(stock),
        type: 'restock',
        notes: 'Initial stock',
      },
    });
  }

  return newItem;
}

/**
 * Admin: 更新库存
 */
export async function updateInventoryItemAction(id: string, body: any) {
  await requireAdmin();
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
  const isRecommended = body.is_recommended ?? body.isRecommended ?? undefined;
  const elasticity = body.elasticity ?? undefined;
  const durability = body.durability ?? undefined;
  const control = body.control ?? undefined;

  return prisma.stringInventory.update({
    where: { id },
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
      // isRecommended: isRecommended !== undefined ? Boolean(isRecommended) : undefined,
      // elasticity: elasticity !== undefined ? (elasticity || null) : undefined,
      // durability: durability !== undefined ? (durability || null) : undefined,
      // control: control !== undefined ? (control || null) : undefined,
    },
  });
}

/**
 * Admin: 删除库存
 */
export async function deleteInventoryItemAction(id: string) {
  await requireAdmin();

  const orderCount = await prisma.order.count({ where: { stringId: id } });
  if (orderCount > 0) {
    throw new Error('该球线已有订单记录，无法删除');
  }

  await prisma.stockLog.deleteMany({ where: { stringId: id } });
  await prisma.stringInventory.delete({ where: { id } });

  return { success: true };
}

/**
 * Admin: 库存调整
 */
export async function adjustInventoryStockAction(id: string, body: any) {
  const admin = await requireAdmin();
  const change = body.change;
  const type = body.type;
  const reason = body.reason;

  if (change === undefined || change === 0) {
    throw new Error('变更数量不能为空或为0');
  }

  const string = await prisma.stringInventory.findUnique({ where: { id } });
  if (!string) {
    throw new Error('库存不存在');
  }

  const newStock = string.stock + change;
  if (newStock < 0) {
    throw new Error(`库存不足，当前库存: ${string.stock}，变更量: ${change}`);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.stringInventory.update({
      where: { id },
      data: { stock: { increment: change } },
    });

    await tx.stockLog.create({
      data: {
        stringId: id,
        change,
        type: type || (change > 0 ? 'restock' : 'adjustment'),
        notes: reason || `管理员调整库存: ${change > 0 ? '+' : ''}${change}`,
        createdBy: admin.id,
      },
    });

    return updated;
  });
}

/**
 * Admin: 库存变动记录
 */
export async function getInventoryLogsAction(id: string) {
  await requireAdmin();
  return prisma.stockLog.findMany({
    where: { stringId: id },
    orderBy: { createdAt: 'desc' },
    include: {
      createdByUser: { select: { id: true, fullName: true, email: true } },
    },
  });
}
