/**
 * Profile API
 * GET /api/profile
 * PATCH /api/profile
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/server-auth';
import { parseJson } from '@/lib/validation';
import { okResponse, failResponse } from '@/lib/api-response';
import { getUserProfile, updateUserProfile } from '@/server/services/profile.service';
import { handleApiError } from '@/lib/api/handleApiError';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  fullName: z.string().trim().max(120).optional(),
  full_name: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(255).optional(),
  avatar_url: z.string().trim().max(500).optional(),
  avatarUrl: z.string().trim().max(500).optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const profile = await getUserProfile(user.id);
    return okResponse(profile);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = await parseJson(request, bodySchema);
    if (!parsed.ok) {
      if (parsed.type === 'invalid_json') {
        return failResponse('BAD_REQUEST', 'Invalid JSON body', 400);
      }
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid request body', 422, parsed.error.flatten());
    }

    const updated = await updateUserProfile(user.id, parsed.data);
    return okResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
