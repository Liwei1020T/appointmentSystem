/**
 * Order photos API
 * GET /api/orders/:id/photos
 * POST /api/orders/:id/photos (admin only)
 */

import { z } from 'zod';
import { requireAdmin, requireAuth } from '@/lib/server-auth';
import { failResponse, okResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import {
  addOrderPhoto,
  listOrderPhotos,
} from '@/server/services/order-photos.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const bodySchema = z
  .object({
    photoUrl: z.string().min(1).optional(),
    photo_url: z.string().min(1).optional(),
    photoType: z.enum(['before', 'after', 'detail', 'other']).optional(),
    photo_type: z.enum(['before', 'after', 'detail', 'other']).optional(),
    caption: z.string().optional(),
    displayOrder: z.number().int().nonnegative().optional(),
    display_order: z.number().int().nonnegative().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.photoUrl && !data.photo_url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'photoUrl is required',
        path: ['photoUrl'],
      });
    }
  });

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const parsedParams = paramsSchema.safeParse(params);
    if (!parsedParams.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid order id', 422, parsedParams.error.flatten());
    }

    const photos = await listOrderPhotos(user, parsedParams.data.id);
    return okResponse(photos);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    const parsedParams = paramsSchema.safeParse(params);
    if (!parsedParams.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid order id', 422, parsedParams.error.flatten());
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return handleApiError(error);
    }

    const parsedBody = bodySchema.safeParse(body);
    if (!parsedBody.success) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Validation failed', 422, parsedBody.error.flatten());
    }

    const payload = parsedBody.data;
    const newPhoto = await addOrderPhoto(admin, {
      orderId: parsedParams.data.id,
      photoUrl: payload.photoUrl || payload.photo_url!,
      photoType: payload.photoType || payload.photo_type || 'after',
      caption: payload.caption,
      displayOrder: payload.displayOrder ?? payload.display_order,
    });

    return okResponse(newPhoto, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
