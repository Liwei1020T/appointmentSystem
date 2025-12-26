/**
 * Admin packages API
 * GET /api/admin/packages
 * POST /api/admin/packages
 * PATCH /api/admin/packages (legacy update)
 */

import { z } from 'zod';
import { requireAdmin } from '@/lib/server-auth';
import { failResponse, okResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import {
  createAdminPackage,
  listAdminPackages,
  updateAdminPackage,
} from '@/server/services/admin-package.service';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  status: z.enum(['active', 'inactive', 'all']).optional(),
  search: z.string().optional(),
  includeInactive: z.enum(['true', 'false']).optional(),
});

const baseSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  times: z.coerce.number().int().positive().optional(),
  price: z.coerce.number().positive().optional(),
  validityDays: z.coerce.number().int().positive().optional(),
  validity_days: z.coerce.number().int().positive().optional(),
  active: z.boolean().optional(),
  imageUrl: z.string().optional(),
  image_url: z.string().optional(),
});

const createSchema = baseSchema.superRefine((data, ctx) => {
  if (!data.name) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'name is required',
      path: ['name'],
    });
  }
  if (!data.times) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'times is required',
      path: ['times'],
    });
  }
  if (!data.price) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'price is required',
      path: ['price'],
    });
  }
  if (!data.validityDays && !data.validity_days) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'validityDays is required',
      path: ['validityDays'],
    });
  }
});

const updateSchema = baseSchema.extend({
  id: z.string().uuid(),
});

/**
 * 获取套餐列表
 * 支持查询参数:
 * - status: active | inactive | all (default all)
 * - search: 模糊搜索名称/描述
 * - includeInactive: boolean (default true)
 */
export async function GET(request: Request) {
  try {
    await requireAdmin();

    const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid query parameters', 422, parsed.error.flatten());
    }

    const packages = await listAdminPackages({
      status: parsed.data.status ?? 'all',
      search: parsed.data.search,
      includeInactive: parsed.data.includeInactive !== 'false',
    });

    return okResponse(packages);
  } catch (error: any) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    console.error('Get packages error:', error);
    return failResponse('INTERNAL_ERROR', 'Failed to fetch packages', 500);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

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

    const payload = parsed.data;
    const pkg = await createAdminPackage({
      name: payload.name!,
      description: payload.description,
      times: payload.times!,
      price: Number(payload.price),
      validityDays: Number(payload.validityDays ?? payload.validity_days),
      active: payload.active,
      imageUrl: payload.imageUrl || payload.image_url,
    });

    return okResponse(pkg, { status: 201 });
  } catch (error: any) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    console.error('Create package error:', error);
    return failResponse('INTERNAL_ERROR', 'Failed to create package', 500);
  }
}

/**
 * 管理员 - 更新套餐 API
 * PATCH /api/admin/packages
 */
export async function PATCH(request: Request) {
  try {
    await requireAdmin();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return failResponse('BAD_REQUEST', 'Invalid JSON body', 400);
    }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Validation failed', 422, parsed.error.flatten());
    }

    const payload = parsed.data;
    const hasUpdates = Object.keys(payload).some(
      (key) => key !== 'id' && payload[key as keyof typeof payload] !== undefined
    );

    if (!hasUpdates) {
      return failResponse('BAD_REQUEST', 'No fields to update', 400);
    }

    const pkg = await updateAdminPackage(payload.id, {
      name: payload.name,
      description: payload.description,
      times: payload.times,
      price: payload.price !== undefined ? Number(payload.price) : undefined,
      validityDays: payload.validityDays ?? payload.validity_days,
      active: payload.active,
      imageUrl: payload.imageUrl || payload.image_url,
    });

    return okResponse(pkg);
  } catch (error: any) {
    if (isApiError(error)) {
      return failResponse(error.code, error.message, error.status, error.details);
    }
    console.error('Update package error:', error);
    return failResponse('INTERNAL_ERROR', 'Failed to update package', 500);
  }
}
