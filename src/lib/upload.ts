/**
 * File Upload Utility
 * 本地文件存储，替代 Supabase Storage
 */

import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE ?? 0);
const MAX_FILE_SIZE = Number.isFinite(MAX_FILE_SIZE_MB) && MAX_FILE_SIZE_MB > 0
  ? MAX_FILE_SIZE_MB * 1024 * 1024
  : 0;
const IMAGE_MAGIC_VALIDATORS: Record<string, (buffer: Buffer) => boolean> = {
  'image/jpeg': (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  'image/jpg': (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  'image/png': (buffer) =>
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a,
  'image/gif': (buffer) =>
    buffer.length >= 6 &&
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61,
  'image/webp': (buffer) =>
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50,
};

function getUploadRoot() {
  return path.resolve(process.cwd(), 'public', UPLOAD_DIR);
}

function isPathWithin(basePath: string, targetPath: string) {
  const normalizedBase = basePath.endsWith(path.sep) ? basePath : `${basePath}${path.sep}`;
  return targetPath === basePath || targetPath.startsWith(normalizedBase);
}

export function validateImageMagicBytes(buffer: Buffer, mimeType: string) {
  if (!mimeType.startsWith('image/')) {
    return;
  }

  const validator = IMAGE_MAGIC_VALIDATORS[mimeType.toLowerCase()];
  if (!validator) {
    throw new Error('Unsupported image MIME type');
  }

  if (!validator(buffer)) {
    throw new Error('File content does not match declared MIME type');
  }
}

/**
 * 保存上传的文件
 */
export async function saveFile(
  file: File | Blob,
  folder: string = '',
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  }
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || '';

  validateImageMagicBytes(buffer, mimeType);
  
  // 检查文件大小
  if (MAX_FILE_SIZE > 0 && buffer.length > MAX_FILE_SIZE) {
    throw new Error(`文件大小超过限制 (${MAX_FILE_SIZE_MB}MB)`);
  }

  // 生成文件名
  const ext = mimeType.split('/')[1] || 'jpg';
  const filename = `${randomUUID()}.${ext}`;
  const safeFolder = folder.replace(/^[\\/]+/, '').replace(/\\+/g, '/');
  const uploadRoot = getUploadRoot();
  const uploadPath = path.resolve(uploadRoot, safeFolder);

  if (!isPathWithin(uploadRoot, uploadPath)) {
    throw new Error('Invalid upload path');
  }

  const filePath = path.resolve(uploadPath, filename);
  if (!isPathWithin(uploadRoot, filePath)) {
    throw new Error('Invalid upload path');
  }

  // 确保目录存在
  await fs.mkdir(uploadPath, { recursive: true });

  // 如果是图片且指定了尺寸限制，进行压缩
  if (file.type?.startsWith('image/') && options) {
    const image = sharp(buffer);
    
    if (options.maxWidth || options.maxHeight) {
      image.resize(options.maxWidth, options.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
    
    if (options.quality) {
      image.jpeg({ quality: options.quality });
    }
    
    await image.toFile(filePath);
  } else {
    await fs.writeFile(filePath, buffer);
  }

  // 返回相对于 public 的路径
  const folderPath = safeFolder ? `${safeFolder}/` : '';
  return `/${UPLOAD_DIR}/${folderPath}${filename}`;
}

/**
 * 删除文件
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    const sanitizedPath = filePath.replace(/^[\\/]+/, '');
    const uploadRoot = getUploadRoot();
    const fullPath = path.resolve(process.cwd(), 'public', sanitizedPath);

    if (!isPathWithin(uploadRoot, fullPath)) {
      throw new Error('Invalid delete path');
    }

    await fs.unlink(fullPath);
    return true;
  } catch (error) {
    console.error('Failed to delete file:', error);
    return false;
  }
}

/**
 * 获取文件信息
 */
export async function getFileInfo(filePath: string) {
  try {
    // 防止路径遍历攻击
    const sanitizedPath = filePath.replace(/^[\\/]+/, '');
    const uploadRoot = getUploadRoot();
    const fullPath = path.resolve(process.cwd(), 'public', sanitizedPath);

    // 只允许访问 upload 目录内的文件
    if (!isPathWithin(uploadRoot, fullPath)) {
      return { exists: false };
    }

    const stats = await fs.stat(fullPath);
    return {
      exists: true,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
    };
  } catch {
    return { exists: false };
  }
}

/**
 * 从 FormData 获取文件
 */
export async function getFileFromFormData(formData: FormData, fieldName: string = 'file'): Promise<File | null> {
  const file = formData.get(fieldName);
  if (file instanceof File) {
    return file;
  }
  return null;
}
