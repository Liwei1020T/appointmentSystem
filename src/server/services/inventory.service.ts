import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api-errors';
import { isValidUUID } from '@/lib/utils';

export type InventoryPayload = {
  name?: string;
  model?: string;
  brand?: string;
  description?: string | null;
  cost_price?: number | string;
  costPrice?: number | string;
  selling_price?: number | string;
  sellingPrice?: number | string;
  stock_quantity?: number | string;
  stock?: number | string;
  minimum_stock?: number | string;
  minimumStock?: number | string;
  color?: string | null;
  gauge?: string | null;
  image_url?: string | null;
  imageUrl?: string | null;
  active?: boolean;
};

type AdminSnapshot = {
  id: string;
};

function toNumber(value: number | string | undefined) {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function resolvePayload(payload: InventoryPayload) {
  return {
    model: payload.name || payload.model,
    brand: payload.brand,
    description: payload.description ?? null,
    costPrice: toNumber(payload.cost_price ?? payload.costPrice),
    sellingPrice: toNumber(payload.selling_price ?? payload.sellingPrice),
    stock: toNumber(payload.stock_quantity ?? payload.stock),
    minimumStock: toNumber(payload.minimum_stock ?? payload.minimumStock),
    color: payload.color ?? null,
    gauge: payload.gauge ?? null,
    imageUrl: payload.image_url ?? payload.imageUrl ?? null,
    active: payload.active,
  };
}

/**
 * Fetch inventory list for public usage.
 */
export async function listInventory(activeOnly: boolean) {
  return prisma.stringInventory.findMany({
    where: activeOnly ? { active: true } : {},
    orderBy: [{ brand: 'asc' }, { model: 'asc' }],
  });
}

/**
 * Fetch inventory list for admin usage.
 */
export async function listAdminInventory() {
  return prisma.stringInventory.findMany({ orderBy: { createdAt: 'desc' } });
}

/**
 * Fetch a single inventory item by UUID.
 */
export async function getInventoryItem(id: string) {
  if (!isValidUUID(id)) {
    throw new ApiError('BAD_REQUEST', 400, 'Invalid inventory id');
  }

  const item = await prisma.stringInventory.findUnique({ where: { id } });
  if (!item) {
    throw new ApiError('NOT_FOUND', 404, 'String not found');
  }

  return item;
}

/**
 * Create a new inventory record (admin only).
 */
export async function createInventoryItem(admin: AdminSnapshot, payload: InventoryPayload) {
  const resolved = resolvePayload(payload);

  if (!resolved.model || !resolved.brand) {
    throw new ApiError('BAD_REQUEST', 400, 'Model and brand are required');
  }

  if (!resolved.costPrice || !resolved.sellingPrice) {
    throw new ApiError('BAD_REQUEST', 400, 'Cost price and selling price are required');
  }

  const stockValue = resolved.stock ?? 0;
  const minimumStockValue = resolved.minimumStock ?? 5;

  const newItem = await prisma.stringInventory.create({
    data: {
      model: resolved.model,
      brand: resolved.brand,
      description: resolved.description,
      costPrice: resolved.costPrice,
      sellingPrice: resolved.sellingPrice,
      stock: stockValue,
      minimumStock: minimumStockValue,
      color: resolved.color,
      gauge: resolved.gauge,
      imageUrl: resolved.imageUrl,
      active: resolved.active ?? true,
    },
  });

  if (stockValue > 0) {
    await prisma.stockLog.create({
      data: {
        stringId: newItem.id,
        change: stockValue,
        type: 'restock',
        notes: 'Initial stock',
        createdBy: admin.id,
      },
    });
  }

  return newItem;
}

/**
 * Update an inventory record (admin only).
 */
export async function updateInventoryItem(id: string, payload: InventoryPayload) {
  if (!isValidUUID(id)) {
    throw new ApiError('BAD_REQUEST', 400, 'Invalid inventory id');
  }

  const resolved = resolvePayload(payload);
  const updateData: Record<string, unknown> = {};

  if (resolved.model !== undefined) updateData.model = resolved.model;
  if (resolved.brand !== undefined) updateData.brand = resolved.brand;
  if (resolved.description !== undefined) updateData.description = resolved.description;
  if (resolved.costPrice !== undefined) updateData.costPrice = resolved.costPrice;
  if (resolved.sellingPrice !== undefined) updateData.sellingPrice = resolved.sellingPrice;
  if (resolved.stock !== undefined) updateData.stock = resolved.stock;
  if (resolved.minimumStock !== undefined) updateData.minimumStock = resolved.minimumStock;
  if (resolved.color !== undefined) updateData.color = resolved.color;
  if (resolved.gauge !== undefined) updateData.gauge = resolved.gauge;
  if (resolved.imageUrl !== undefined) updateData.imageUrl = resolved.imageUrl;
  if (resolved.active !== undefined) updateData.active = resolved.active;

  return prisma.stringInventory.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Delete an inventory record if no orders reference it (admin only).
 */
export async function deleteInventoryItem(id: string) {
  if (!isValidUUID(id)) {
    throw new ApiError('BAD_REQUEST', 400, 'Invalid inventory id');
  }

  const orderCount = await prisma.order.count({ where: { stringId: id } });
  if (orderCount > 0) {
    throw new ApiError('CONFLICT', 409, 'Inventory item has related orders');
  }

  await prisma.stockLog.deleteMany({ where: { stringId: id } });
  await prisma.stringInventory.delete({ where: { id } });

  return { success: true };
}

/**
 * Adjust inventory stock and write a stock log entry (admin only).
 */
export async function adjustInventoryStock(
  admin: AdminSnapshot,
  id: string,
  payload: { change: number; type?: string; reason?: string }
) {
  if (!isValidUUID(id)) {
    throw new ApiError('BAD_REQUEST', 400, 'Invalid inventory id');
  }

  if (!Number.isFinite(payload.change) || payload.change === 0) {
    throw new ApiError('BAD_REQUEST', 400, 'Change must be non-zero');
  }

  const string = await prisma.stringInventory.findUnique({ where: { id } });
  if (!string) {
    throw new ApiError('NOT_FOUND', 404, 'Inventory item not found');
  }

  const newStock = string.stock + payload.change;
  if (newStock < 0) {
    throw new ApiError('CONFLICT', 409, `Insufficient stock (${string.stock})`);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.stringInventory.update({
      where: { id },
      data: { stock: { increment: payload.change } },
    });

    await tx.stockLog.create({
      data: {
        stringId: id,
        change: payload.change,
        type: payload.type || (payload.change > 0 ? 'restock' : 'adjustment'),
        notes: payload.reason || `Admin adjusted stock: ${payload.change > 0 ? '+' : ''}${payload.change}`,
        createdBy: admin.id,
      },
    });

    return updated;
  });
}

/**
 * List stock logs (admin only).
 */
export async function listInventoryLogs(params: {
  stringId?: string;
  limit?: number;
  offset?: number;
}) {
  const where = params.stringId ? { stringId: params.stringId } : {};
  return prisma.stockLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      createdByUser: { select: { id: true, fullName: true, email: true } },
      string: { select: { id: true, brand: true, model: true } },
    },
    ...(params.limit ? { take: params.limit } : {}),
    ...(params.offset ? { skip: params.offset } : {}),
  });
}
