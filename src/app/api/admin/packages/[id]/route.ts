import { z } from 'zod';
import { requireAdmin } from '@/lib/server-auth';
import { failResponse, okResponse } from '@/lib/api-response';
import {
  deleteAdminPackage,
  getAdminPackageById,
  updateAdminPackage,
} from '@/server/services/admin-package.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const updateSchema = z.object({
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

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const parsed = paramsSchema.safeParse(params);
    if (!parsed.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid package id', 422, parsed.error.flatten());
    }

    const pkg = await getAdminPackageById(parsed.data.id);
    return okResponse(pkg);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const parsedParams = paramsSchema.safeParse(params);
    if (!parsedParams.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid package id', 422, parsedParams.error.flatten());
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

    const payload = parsedBody.data;
    const hasUpdates = Object.values(payload).some((value) => value !== undefined);
    if (!hasUpdates) {
      return failResponse('BAD_REQUEST', 'No fields to update', 400);
    }

    const pkg = await updateAdminPackage(parsedParams.data.id, {
      name: payload.name,
      description: payload.description,
      times: payload.times,
      price: payload.price !== undefined ? Number(payload.price) : undefined,
      validityDays: payload.validityDays ?? payload.validity_days,
      active: payload.active,
      imageUrl: payload.imageUrl || payload.image_url,
    });

    return okResponse(pkg);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const parsed = paramsSchema.safeParse(params);
    if (!parsed.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid package id', 422, parsed.error.flatten());
    }

    await deleteAdminPackage(parsed.data.id);
    return okResponse({ id: parsed.data.id });
  } catch (error) {
    return handleApiError(error);
  }
}
