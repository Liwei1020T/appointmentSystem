/**
 * API Response Utilities
 * 统一 API 响应格式
 */

import { NextResponse } from 'next/server';

export function successResponse<T>(data: T, message?: string) {
  return NextResponse.json({
    success: true,
    data,
    message,
  });
}

export function errorResponse(message: string, status: number = 400, details?: any) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      details,
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
