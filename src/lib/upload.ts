/**
 * File Upload Utility
 * 本地文件存储，替代 Supabase Storage
 */

import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5') * 1024 * 1024; // MB to bytes

function getUploadRoot() {
  return path.resolve(process.cwd(), 'public', UPLOAD_DIR);
}

function isPathWithin(basePath: string, targetPath: string) {
  const normalizedBase = basePath.endsWith(path.sep) ? basePath : `${basePath}${path.sep}`;
  return targetPath === basePath || targetPath.startsWith(normalizedBase);
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
  
  // 检查文件大小
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(`文件大小超过限制 (${MAX_FILE_SIZE / 1024 / 1024}MB)`);
  }

  // 生成文件名
  const ext = file.type?.split('/')[1] || 'jpg';
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
    const fullPath = path.join(process.cwd(), 'public', filePath);
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
