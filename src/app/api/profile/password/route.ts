import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/server-auth';
import { parseJson } from '@/lib/validation';
import { okResponse, failResponse } from '@/lib/api-response';
import { isApiError } from '@/lib/api-errors';
import { changePassword } from '@/server/services/profile.service';
import { handleApiError } from '@/lib/api/handleApiError';

const bodySchema = z.object({
  currentPassword: z.string().trim().optional(),
  newPassword: z.string().trim().min(8),
});

/**
 * Change password API
 * POST /api/profile/password
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = await parseJson(request, bodySchema);
    if (!parsed.ok) {
      if (parsed.type === 'invalid_json') {
        return failResponse('BAD_REQUEST', 'Invalid JSON body', 400);
      }
      return failResponse('UNPROCESSABLE_ENTITY', 'Invalid request body', 422, parsed.error.flatten());
    }

    const result = await changePassword(user.id, {
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
    });
    return okResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
