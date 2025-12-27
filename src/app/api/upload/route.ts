/**
 * 图片上传 API
 * POST /api/upload
 */

import { NextRequest } from 'next/server';
import { saveFile, getFileFromFormData } from '@/lib/upload';
import { requireAuth } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { handleApiError } from '@/lib/api/handleApiError';

const ALLOWED_UPLOAD_ROOTS = new Set([
  'general',
  'payments',
  'payment-proofs',
  'avatars',
  'orders',
  'reviews',
  'receipts',
  'rackets',
  'uploads',
]);

const SEGMENT_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

function normalizeUploadFolder(rawFolder: string) {
  const sanitized = rawFolder.replace(/\\+/g, '/');
  const segments = sanitized.split('/').filter(Boolean);

  if (segments.length === 0) return null;
  if (!ALLOWED_UPLOAD_ROOTS.has(segments[0])) return null;
  if (!segments.every((segment) => SEGMENT_PATTERN.test(segment))) return null;

  return segments.join('/');
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const formData = await request.formData();
    const file = await getFileFromFormData(formData, 'file');
    const rawFolder = (formData.get('folder') as string) || 'general';
    const folder = normalizeUploadFolder(rawFolder);

    if (!file) {
      return errorResponse('没有上传文件');
    }

    if (!folder) {
      return errorResponse('上传目录无效', 422);
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return errorResponse('只支持图片文件 (JPEG, PNG, WebP, GIF)');
    }

    // 保存文件
    const filePath = await saveFile(file, folder, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 85,
    });

    return successResponse({
      url: filePath,
      name: file.name,
      size: file.size,
      type: file.type,
    }, '上传成功');

  } catch (error) {
    return handleApiError(error);
  }
}
