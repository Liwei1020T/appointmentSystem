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

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadImage, UploadOptions, UploadResult } from '@/services/imageUploadService';

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
    const newPreviews: ImagePreview[] = validFiles.map((file) => ({
      url: URL.createObjectURL(file),
      file,
      uploaded: false,
      uploading: true,
    }));

    setImages((prev) => [...prev, ...newPreviews]);

    // 上传文件
    const results: UploadResult[] = [];
    
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      
      try {
        const result = await uploadImage(file, uploadOptions);
        results.push(result);
        
        // 更新预览状态
        setImages((prev) =>
          prev.map((img, idx) =>
            idx === images.length + i
              ? { ...img, uploading: false, uploaded: result.success, url: result.url || img.url }
              : img
          )
        );

        if (!result.success) {
          onUploadError?.(result.error || '上传失败');
        }
      } catch (error) {
        console.error('上传失败:', error);
        onUploadError?.('上传失败，请重试');
        
        // 移除失败的预览
        setImages((prev) => prev.filter((_, idx) => idx !== images.length + i));
      }
    }

    // 清理对象 URL
    newPreviews.forEach((preview) => {
      if (preview.file) {
        URL.revokeObjectURL(preview.url);
      }
    });

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
    setImages((prev) => prev.filter((_, idx) => idx !== index));
    onDelete?.(index);
  };

  return (
    <div className="space-y-3">
      {/* 标签 */}
      {label && (
        <label className="block text-sm font-medium text-text-secondary">
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
              ? 'border-accent-border bg-ink-elevated' 
              : 'border-border-subtle hover:border-accent-border hover:bg-ink-elevated'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-text-tertiary mb-3" />
          <p className="text-text-secondary font-medium mb-1">
            {hint.replace('{max}', maxFiles.toString())}
          </p>
          <p className="text-sm text-text-tertiary">
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
              className="relative aspect-square rounded-lg overflow-hidden border border-border-subtle group"
            >
              {/* 图片 */}
              <img
                src={image.url}
                alt={`预览 ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* 上传中遮罩 */}
              {image.uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-text-onAccent animate-spin" />
                </div>
              )}

              {/* 删除按钮 */}
              {!image.uploading && (
                <button
                  onClick={() => handleDelete(index)}
                  className="absolute top-2 right-2 bg-danger text-text-primary rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger/90"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* 已上传标识 */}
              {image.uploaded && !image.uploading && (
                <div className="absolute bottom-2 right-2 bg-success text-text-primary text-xs px-2 py-1 rounded">
                  已上传
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 图片数量提示 */}
      {images.length > 0 && (
        <p className="text-sm text-text-tertiary">
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
