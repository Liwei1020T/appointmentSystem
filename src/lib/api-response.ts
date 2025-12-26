/**
 * API Response Utilities
 * 统一 API 响应格式
 */

import type { ApiErrorCode } from '@/lib/api-errors';

const STATUS_CODE_MAP: Record<number, ApiErrorCode> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_ENTITY',
  500: 'INTERNAL_ERROR',
};

const ERROR_CODE_SET = new Set<ApiErrorCode>([
  'BAD_REQUEST',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'UNPROCESSABLE_ENTITY',
  'INTERNAL_ERROR',
  'FEATURE_DISABLED',
]);

function resolveErrorCode(status: number, code?: ApiErrorCode): ApiErrorCode {
  if (code) return code;
  return STATUS_CODE_MAP[status] || 'INTERNAL_ERROR';
}

function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return typeof value === 'string' && ERROR_CODE_SET.has(value as ApiErrorCode);
}

export function successResponse<T>(data: T, message?: string) {
  return Response.json({
    ok: true,
    success: true,
    data,
    message,
  });
}

export function errorResponse(message: string, status: number = 400, details?: any, code?: ApiErrorCode) {
  let resolvedCode = code;
  let resolvedDetails = details;

  if (!resolvedCode && isApiErrorCode(details)) {
    resolvedCode = details;
    resolvedDetails = undefined;
  }

  const errorCode = resolveErrorCode(status, resolvedCode);

  return Response.json(
    {
      ok: false,
      success: false,
      error: {
        code: errorCode,
        message,
        details: resolvedDetails,
      },
    },
    { status }
  );
}

export function unauthorizedResponse(message: string = '未授权访问') {
  return errorResponse(message, 401);
}

export function notFoundResponse(message: string = '资源不存在') {
  return errorResponse(message, 404);
}

export function serverErrorResponse(message: string = '服务器错误', error?: any) {
  console.error('Server error:', error);
  return errorResponse(message, 500, process.env.NODE_ENV === 'development' ? error : undefined);
}

export function okResponse<T>(data: T, init?: ResponseInit) {
  return Response.json(
    {
      ok: true,
      success: true,
      data,
    },
    init
  );
}

export function failResponse(code: ApiErrorCode, message: string, status = 400, details?: unknown) {
  return Response.json(
    {
      ok: false,
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  );
}
