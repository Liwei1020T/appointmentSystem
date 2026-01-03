/**
 * Orders API
 * GET /api/orders - list current user orders
 * POST /api/orders - create single or multi-racket order
 */

import { z } from 'zod';
import { requireAuth } from '@/lib/server-auth';
import { failResponse, okResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import {
  createMultiRacketOrder,
  createOrder,
  getUserOrders,
} from '@/server/services/order.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

const itemSchema = z.object({
  stringId: z.string().uuid(),
  tensionVertical: z.number(),
  tensionHorizontal: z.number(),
  racketBrand: z.string().optional(),
  racketModel: z.string().optional(),
  racketPhoto: z.string().min(1),
  notes: z.string().optional(),
});

const createMultiSchema = z.object({
  items: z.array(itemSchema).min(1),
  usePackage: z.boolean().optional(),
  packageId: z.string().uuid().optional(),
  voucherId: z.string().uuid().optional(),
  notes: z.string().optional(),
  // 服务方式：到店自取 | 上门取送
  serviceType: z.enum(['in_store', 'pickup_delivery']).optional().default('in_store'),
  pickupAddress: z.string().optional(),
});

const createSingleSchema = z.object({
  stringId: z.string().uuid(),
  tension: z.union([z.number(), z.string()]),
  price: z.union([z.number(), z.string()]).optional(),
  costPrice: z.union([z.number(), z.string()]).optional(),
  discountAmount: z.union([z.number(), z.string()]).optional(),
  finalPrice: z.union([z.number(), z.string()]),
  usePackage: z.boolean().optional(),
  voucherId: z.string().uuid().nullable().optional(),
  notes: z.string().optional(),
});

function parseOptionalNumber(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status') || undefined;
    const limitValue = parseOptionalNumber(searchParams.get('limit'));
    const pageValue = parseOptionalNumber(searchParams.get('page'));

    if (limitValue === null || (limitValue !== undefined && limitValue <= 0)) {
      return failResponse('UNPROCESSABLE_ENTITY', 'limit must be a positive number', 422);
    }
    if (pageValue === null || (pageValue !== undefined && pageValue <= 0)) {
      return failResponse('UNPROCESSABLE_ENTITY', 'page must be a positive number', 422);
    }

    const orders = await getUserOrders(user.id, {
      status,
      limit: limitValue,
      page: pageValue,
    });

    return okResponse(orders);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    let body: unknown;

    try {
      body = await request.json();
    } catch (error) {
      return handleApiError(error);
    }

    if (body && typeof body === 'object' && Array.isArray((body as any).items)) {
      const parsed = createMultiSchema.safeParse(body);
      if (!parsed.success) {
        return failResponse('UNPROCESSABLE_ENTITY', 'Validation failed', 422, parsed.error.flatten());
      }
      const result = await createMultiRacketOrder(user, parsed.data);
      return okResponse(result, { status: 201 });
    }

    const parsed = createSingleSchema.safeParse(body);
    if (!parsed.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Validation failed', 422, parsed.error.flatten());
    }

    const order = await createOrder(user, parsed.data);
    return okResponse(order, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
