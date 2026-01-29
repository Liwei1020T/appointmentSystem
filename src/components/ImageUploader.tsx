/**
 * ImageUploader Component
 * 
 * 通用图片上传组件
 * 
 * 功能：
 * - 单张或多张图片上传
 * - 拖拽上传
 * - 图片预览
 * - 删除图片
 * - 上传进度
 * - 自定义样式
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import { uploadImage, UploadOptions, UploadResult } from '@/services/imageUploadService';
import LoadingSpinner from '@/components/loading/LoadingSpinner';

interface ImageUploaderProps {
  uploadOptions: Omit<UploadOptions, 'fileName'>;
  maxFiles?: number;
  onUploadSuccess?: (results: UploadResult[]) => void;
  onUploadError?: (error: string) => void;
  onDelete?: (index: number) => void;
  existingImages?: string[];
  label?: string;
  hint?: string;
  disabled?: boolean;
}

interface ImagePreview {
  url: string;
  file?: File;
  uploaded: boolean;
  uploading: boolean;
}

export default function ImageUploader({
  uploadOptions,
  maxFiles = 5,
  onUploadSuccess,
  onUploadError,
  onDelete,
  existingImages = [],
  label = '上传图片',
  hint = '点击或拖拽上传图片（最多 {max} 张）',
  disabled = false,
}: ImageUploaderProps) {
  const [images, setImages] = useState<ImagePreview[]>(
    existingImages.map((url) => ({
      url,
      uploaded: true,
      uploading: false,
    }))
  );
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Track blob URLs for cleanup on unmount
  const blobUrlsRef = useRef<Set<string>>(new Set());

  // Cleanup blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      blobUrlsRef.current.clear();
    };
  }, []);

  // 当前可上传数量
  const canUploadMore = images.length < maxFiles;

  // 处理文件选择
  const handleFilesSelect = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // 检查数量限制
    const availableSlots = maxFiles - images.length;
    if (fileArray.length > availableSlots) {
      onUploadError?.(`最多只能上传 ${maxFiles} 张图片`);
      return;
    }

    // 验证文件类型
    const validFiles = fileArray.filter((file) => file.type.startsWith('image/'));
    if (validFiles.length !== fileArray.length) {
      onUploadError?.('部分文件不是图片格式');
    }

    // 创建预览
    const newPreviews: ImagePreview[] = validFiles.map((file) => {
      const blobUrl = URL.createObjectURL(file);
      blobUrlsRef.current.add(blobUrl);
      return {
        url: blobUrl,
        file,
        uploaded: false,
        uploading: true,
      };
    });

    setImages((prev) => [...prev, ...newPreviews]);

    // 上传文件
    const results: UploadResult[] = [];
    
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      
      try {
        const result = await uploadImage(file, uploadOptions);
        results.push(result);
        
        // 更新预览状态 - 如果上传成功，替换 blob URL 为服务器 URL
        setImages((prev) =>
          prev.map((img, idx) => {
            if (idx === images.length + i) {
              // 如果上传成功且有新 URL，清理旧的 blob URL
              if (result.success && result.url && img.url.startsWith('blob:')) {
                blobUrlsRef.current.delete(img.url);
                URL.revokeObjectURL(img.url);
              }
              return { ...img, uploading: false, uploaded: result.success, url: result.url || img.url };
            }
            return img;
          })
        );

        if (!result.success) {
          onUploadError?.(result.error || '上传失败');
        }
      } catch (error) {
        console.error('上传失败:', error);
        onUploadError?.('上传失败，请重试');
        
        // 移除失败的预览
        setImages((prev) => {
          const removed = prev[images.length + i];
          if (removed && removed.url.startsWith('blob:')) {
            blobUrlsRef.current.delete(removed.url);
            URL.revokeObjectURL(removed.url);
          }
          return prev.filter((_, idx) => idx !== images.length + i);
        });
      }
    }

    // NOTE: Blob URLs are now cleaned up in three places:
    // 1. On successful upload - replaced by server URL
    // 2. On failed upload - removed from preview
    // 3. On component unmount - cleanup effect

    // 回调成功结果
    const successResults = results.filter((r) => r.success);
    if (successResults.length > 0) {
      onUploadSuccess?.(successResults);
    }
  };

  // 输入框变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFilesSelect(files);
    }
    // 重置输入框以允许重复选择同一文件
    e.target.value = '';
  };

  // 点击触发文件选择
  const handleClick = () => {
    if (!disabled && canUploadMore) {
      fileInputRef.current?.click();
    }
  };

  // 拖拽事件
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && canUploadMore) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled || !canUploadMore) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFilesSelect(files);
    }
  };

  // 删除图片
  const handleDelete = (index: number) => {
    setImages((prev) => {
      const removed = prev[index];
      // Clean up blob URL if it's a local preview
      if (removed && removed.url.startsWith('blob:')) {
        blobUrlsRef.current.delete(removed.url);
        URL.revokeObjectURL(removed.url);
      }
      return prev.filter((_, idx) => idx !== index);
    });
    onDelete?.(index);
  };

  return (
    <div className="space-y-3">
      {/* 标签 */}
      {label && (
        <label className="block text-sm font-medium text-text-secondary dark:text-gray-400">
          {label}
        </label>
      )}

      {/* 上传区域 */}
      {canUploadMore && !disabled && (
        <div
          className={`
            border-2 border-dashed rounded-lg p-6
            flex flex-col items-center justify-center
            cursor-pointer transition-all
            ${isDragging
              ? 'border-accent-border bg-ink-elevated dark:bg-dark-elevated'
              : 'border-border-subtle dark:border-gray-700 hover:border-accent-border hover:bg-ink dark:hover:bg-gray-800'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-text-tertiary dark:text-gray-500 mb-3" />
          <p className="text-text-secondary dark:text-gray-400 font-medium mb-1">
            {hint.replace('{max}', maxFiles.toString())}
          </p>
          <p className="text-sm text-text-tertiary dark:text-gray-500">
            支持 JPG、PNG、WebP、GIF（最大5MB）
          </p>
        </div>
      )}

      {/* 图片预览网格 */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden border border-border-subtle dark:border-gray-700 group"
            >
              {/* 图片 - 使用原生 img 因为支持 blob URLs */}
              <img
                src={image.url}
                alt={`预览 ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />

              {/* 上传中遮罩 */}
              {image.uploading && (
                <div className="absolute inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center">
                  <LoadingSpinner size="md" tone="inverse" className="w-8 h-8" />
                </div>
              )}

              {/* 删除按钮 */}
              {!image.uploading && (
                <button
                  onClick={() => handleDelete(index)}
                  className="absolute top-2 right-2 bg-danger text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger/90"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* 已上传标识 */}
              {image.uploaded && !image.uploading && (
                <div className="absolute bottom-2 right-2 bg-success text-white text-xs px-2 py-1 rounded">
                  已上传
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 图片数量提示 */}
      {images.length > 0 && (
        <p className="text-sm text-text-tertiary dark:text-gray-500">
          已选择 {images.length} / {maxFiles} 张图片
        </p>
      )}

      {/* 隐藏的文件输入框 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        multiple={maxFiles > 1}
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
