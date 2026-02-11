export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNPROCESSABLE_ENTITY'
  | 'INTERNAL_ERROR'
  | 'FEATURE_DISABLED';

/**
 * 统一的应用错误类
 * 用于 API 路由和服务层抛出带有错误码的结构化错误
 *
 * @param code - 错误码（见 docs/ERROR_CODES.md）
 * @param status - HTTP 状态码
 * @param message - 错误描述
 * @param details - 额外的错误详情
 */
export class AppError extends Error {
  code: ApiErrorCode;
  status: number;
  details?: unknown;

  constructor(code: ApiErrorCode, status: number, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// NOTE: 向后兼容别名，新代码应使用 AppError
export const ApiError = AppError;
export type ApiError = AppError;

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

// NOTE: 向后兼容别名
export const isApiError = isAppError;
