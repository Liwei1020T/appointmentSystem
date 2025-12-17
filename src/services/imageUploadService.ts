/**
 * Image Upload Service
 * 处理图片上传到本地存储
 */

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface UploadOptions {
  folder?: string;
  fileName?: string;
  bucket?: string;
  maxSizeKB?: number;
  allowedTypes?: string[];
  compress?: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * 上传单个图片文件
 * 支持两种调用方式:
 * - uploadImage(file, folder) - 旧方式
 * - uploadImage(file, options) - 新方式
 */
export async function uploadImage(
  file: File,
  folderOrOptions: string | UploadOptions = 'uploads'
): Promise<UploadResult> {
  try {
    const options = typeof folderOrOptions === 'string' 
      ? { folder: folderOrOptions }
      : folderOrOptions;
    
    const folder = options.folder || options.bucket || 'uploads';
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    
    // 如果提供了自定义文件名，添加到formData
    if (options.fileName) {
      formData.append('fileName', options.fileName);
    }

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    // 上传接口使用 successResponse 包裹返回值，这里需要兼容 { data: { url } } 结构
    const payload = await response.json().catch(() => ({}));
    const fileUrl =
      payload?.url ||
      payload?.data?.url ||
      payload?.data?.path ||
      payload?.data?.filePath;

    if (!response.ok || !fileUrl) {
      const fallbackError = !fileUrl ? 'Upload failed: missing file URL' : 'Upload failed';
      return {
        success: false,
        error: payload?.error || payload?.message || fallbackError,
      };
    }

    return {
      success: true,
      url: fileUrl,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Upload failed',
    };
  }
}

/**
 * 上传多个图片文件
 */
export async function uploadImages(
  files: File[],
  folder: string = 'uploads'
): Promise<UploadResult[]> {
  return Promise.all(files.map((file) => uploadImage(file, folder)));
}

/**
 * 删除图片
 * 支持两种调用方式:
 * - deleteImage(fullUrl) - 使用完整 URL
 * - deleteImage(bucket, path) - 使用 bucket 和 path
 */
export async function deleteImage(imageUrlOrBucket: string, path?: string): Promise<boolean> {
  try {
    let url: string;
    if (path) {
      // 调用方式: deleteImage('avatars', 'path/to/file.jpg')
      url = `/${imageUrlOrBucket}/${path}`;
    } else {
      // 调用方式: deleteImage('http://example.com/avatars/file.jpg')
      url = imageUrlOrBucket;
    }

    const response = await fetch('/api/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to delete image:', error);
    return false;
  }
}

/**
 * 上传用户头像
 */
export async function uploadAvatar(userIdOrFile: string | File, file?: File): Promise<UploadResult> {
  // 支持两种调用方式: uploadAvatar(file) 或 uploadAvatar(userId, file)
  if (userIdOrFile instanceof File) {
    return uploadImage(userIdOrFile, 'avatars');
  }
  const userId = userIdOrFile;
  const actualFile = file!;
  const folder = `avatars/${userId}`;
  return uploadImage(actualFile, folder);
}

/**
 * 上传订单图片
 */
export async function uploadOrderImage(orderId: string, file: File): Promise<UploadResult> {
  const folder = `orders/${orderId}`;
  return uploadImage(file, folder);
}
