import { isApiError } from '@/lib/api-errors';
import { failResponse, serverErrorResponse } from '@/lib/api-response';

export function handleApiError(error: unknown) {
  if (error && typeof (error as { json?: unknown }).json === 'function') {
    return (error as { json: () => Response }).json();
  }

  if (isApiError(error)) {
    return failResponse(error.code, error.message, error.status, error.details);
  }

  if (error instanceof SyntaxError) {
    return failResponse('BAD_REQUEST', 'Invalid JSON body', 400);
  }

  return serverErrorResponse('Internal server error', error);
}
