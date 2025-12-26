export interface ApiErrorPayload {
  code?: string;
  message?: string;
  details?: unknown;
}

export class ApiClientError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function getApiErrorMessage(payload: any, fallback: string) {
  if (!payload) return fallback;
  if (typeof payload.error === 'string') return payload.error;
  if (payload.error?.message) return payload.error.message;
  if (payload.message) return payload.message;
  return fallback;
}

export async function apiRequest<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: 'include',
    ...init,
    headers: {
      ...(init?.headers || {}),
    },
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (payload && typeof payload === 'object') {
    if ('ok' in payload) {
      if (payload.ok) return payload.data as T;
      const message = getApiErrorMessage(payload, 'Request failed');
      throw new ApiClientError(message, response.status, payload.error?.code, payload.error?.details);
    }

    if ('success' in payload) {
      if (payload.success) {
        return (payload.data ?? payload) as T;
      }
      const message = getApiErrorMessage(payload, 'Request failed');
      throw new ApiClientError(message, response.status);
    }
  }

  if (!response.ok) {
    const message = getApiErrorMessage(payload, 'Request failed');
    throw new ApiClientError(message, response.status);
  }

  return payload as T;
}
