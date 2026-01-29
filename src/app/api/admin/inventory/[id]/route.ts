/**
 * Admin inventory detail API
 * GET /api/admin/inventory/:id
 * PUT /api/admin/inventory/:id
 * PATCH /api/admin/inventory/:id
 * DELETE /api/admin/inventory/:id
 */

import { z } from 'zod';
import { requireAdmin } from '@/lib/server-auth';
import { failResponse, okResponse } from '@/lib/api-response';
import {
  adjustInventoryStock,
  deleteInventoryItem,
  getInventoryItem,
  updateInventoryItem,
} from '@/server/services/inventory.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const updateSchema = z.object({
  name: z.string().optional(),
  model: z.string().optional(),
  brand: z.string().optional(),
  description: z.string().nullable().optional(),
  cost_price: z.union([z.number(), z.string()]).optional(),
  costPrice: z.union([z.number(), z.string()]).optional(),
  selling_price: z.union([z.number(), z.string()]).optional(),
  sellingPrice: z.union([z.number(), z.string()]).optional(),
  stock_quantity: z.union([z.number(), z.string()]).optional(),
  stock: z.union([z.number(), z.string()]).optional(),
  minimum_stock: z.union([z.number(), z.string()]).optional(),
  minimumStock: z.union([z.number(), z.string()]).optional(),
  color: z.string().nullable().optional(),
  gauge: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  active: z.boolean().optional(),
  adjustment: z.number().optional(),
  reason: z.string().optional(),
  type: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const parsedParams = paramsSchema.safeParse(params);

    if (!parsedParams.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid inventory id', 422, parsedParams.error.flatten());
    }

    const item = await getInventoryItem(parsedParams.data.id);
    return okResponse(item);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const parsedParams = paramsSchema.safeParse(params);

    if (!parsedParams.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid inventory id', 422, parsedParams.error.flatten());
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return handleApiError(error);
    }

    const parsedBody = updateSchema.safeParse(body);
    if (!parsedBody.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Validation failed', 422, parsedBody.error.flatten());
    }

    const item = await updateInventoryItem(parsedParams.data.id, parsedBody.data);
    return okResponse(item);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const parsedParams = paramsSchema.safeParse(params);

    if (!parsedParams.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid inventory id', 422, parsedParams.error.flatten());
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return handleApiError(error);
    }

    const parsedBody = updateSchema.safeParse(body);
    if (!parsedBody.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Validation failed', 422, parsedBody.error.flatten());
    }

    if (parsedBody.data.adjustment !== undefined) {
      const updated = await adjustInventoryStock(admin, parsedParams.data.id, {
        change: parsedBody.data.adjustment,
        type: parsedBody.data.type,
        reason: parsedBody.data.reason,
      });
      return okResponse(updated);
    }

    const item = await updateInventoryItem(parsedParams.data.id, parsedBody.data);
    return okResponse(item);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const parsedParams = paramsSchema.safeParse(params);

    if (!parsedParams.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid inventory id', 422, parsedParams.error.flatten());
    }

    const result = await deleteInventoryItem(parsedParams.data.id);
    return okResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
