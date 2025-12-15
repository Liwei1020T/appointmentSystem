/**
 * 图片上传 API
 * POST /api/upload
 */

import { NextRequest } from 'next/server';
import { saveFile, getFileFromFormData } from '@/lib/upload';
import { requireAuth } from '@/lib/server-auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const formData = await request.formData();
    const file = await getFileFromFormData(formData, 'file');
    const folder = (formData.get('folder') as string) || 'general';

    if (!file) {
      return errorResponse('没有上传文件');
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

  } catch (error: any) {
    console.error('Upload error:', error);
    return errorResponse(error.message || '上传失败', 500);
  }
}
