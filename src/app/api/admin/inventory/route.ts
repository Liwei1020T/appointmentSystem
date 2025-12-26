/**
 * Admin inventory list/create API
 * GET /api/admin/inventory
 * POST /api/admin/inventory
 */

import { z } from 'zod';
import { requireAdmin } from '@/lib/server-auth';
import { failResponse, okResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import {
  createInventoryItem,
  listAdminInventory,
} from '@/server/services/inventory.service';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  name: z.string().optional(),
  model: z.string().optional(),
  brand: z.string(),
  description: z.string().optional(),
  cost_price: z.union([z.number(), z.string()]).optional(),
  costPrice: z.union([z.number(), z.string()]).optional(),
  selling_price: z.union([z.number(), z.string()]).optional(),
  sellingPrice: z.union([z.number(), z.string()]).optional(),
  stock_quantity: z.union([z.number(), z.string()]).optional(),
  stock: z.union([z.number(), z.string()]).optional(),
  minimum_stock: z.union([z.number(), z.string()]).optional(),
  minimumStock: z.union([z.number(), z.string()]).optional(),
  color: z.string().optional(),
  gauge: z.string().optional(),
  image_url: z.string().optional(),
  imageUrl: z.string().optional(),
  active: z.boolean().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    const inventory = await listAdminInventory();
    return okResponse(inventory);
  } catch (error) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    console.error('Get admin inventory error:', error);
    return failResponse('INTERNAL_ERROR', 'Failed to fetch inventory', 500);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return failResponse('BAD_REQUEST', 'Invalid JSON body', 400);
    }

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Validation failed', 422, parsed.error.flatten());
    }

    const item = await createInventoryItem(admin, parsed.data);
    return okResponse(item, { status: 201 });
  } catch (error) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    console.error('Create inventory error:', error);
    return failResponse('INTERNAL_ERROR', 'Failed to create inventory item', 500);
  }
}
