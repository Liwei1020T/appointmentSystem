/**
 * AvatarUploader Component
 * 
 * 用户头像上传组件
 * 
 * 功能：
 * - 显示当前头像（或首字母）
 * - 点击上传新头像
 * - 拖拽上传支持
 * - 图片预览
 * - 上传进度显示
 * - 删除头像
 */

'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, Upload, X, Loader2, User } from 'lucide-react';
import { uploadAvatar, deleteImage } from '@/services/imageUploadService';

interface AvatarUploaderProps {
  userId: string;
  currentAvatarUrl?: string | null;
  userName?: string;
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (error: string) => void;
  onDelete?: () => void;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
}

export default function AvatarUploader({
  userId,
  currentAvatarUrl,
  userName,
  onUploadSuccess,
  onUploadError,
  onDelete,
  size = 'md',
  editable = true,
}: AvatarUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 尺寸配置
  const sizeClasses = {
    sm: 'w-16 h-16 text-xl',
    md: 'w-24 h-24 text-3xl',
    lg: 'w-32 h-32 text-4xl',
  };

  // 获取用户名首字母
  const getInitials = () => {
    if (!userName) return <User className="w-1/2 h-1/2" />;
    return userName.charAt(0).toUpperCase();
  };

  // 处理文件选择
  const handleFileSelect = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      onUploadError?.('请选择图片文件');
      return;
    }

    setIsUploading(true);

    // 显示预览
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      // 上传图片
      const result = await uploadAvatar(userId, file);

      if (result.success && result.url) {
        onUploadSuccess?.(result.url);
        setPreviewUrl(null);
      } else {
        onUploadError?.(result.error || '上传失败');
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error('上传头像失败:', error);
      onUploadError?.('上传失败，请重试');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  };

  // 输入框变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // 点击触发文件选择
  const handleClick = () => {
    if (editable && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  // 拖拽事件
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (editable && !isUploading) {
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

    if (!editable || isUploading) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // 删除头像
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!currentAvatarUrl) return;

    try {
      // 提取路径并删除
      const urlParts = currentAvatarUrl.split('/avatars/');
      if (urlParts.length > 1) {
        const path = urlParts[1];
        await deleteImage('avatars', path);
      }

      onDelete?.();
    } catch (error) {
      console.error('删除头像失败:', error);
      onUploadError?.('删除失败');
    }
  };

  // 显示的头像 URL
  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 头像区域 */}
      <div
        className={`
          relative rounded-full overflow-hidden
          ${sizeClasses[size]}
          ${editable ? 'cursor-pointer group' : ''}
          ${isDragging ? 'ring-4 ring-accent-border' : ''}
          ${isUploading ? 'opacity-50' : ''}
          transition-all
        `}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* 头像图片或首字母 */}
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt="用户头像"
            width={128}
            height={128}
            className="w-full h-full object-cover"
            priority={size === 'lg'}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent/40 to-info/40 flex items-center justify-center text-text-primary font-semibold">
            {getInitials()}
          </div>
        )}

        {/* 上传中遮罩 */}
        {isUploading && (
          <div className="absolute inset-0 bg-ink/60 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-text-primary animate-spin" />
          </div>
        )}

        {/* 悬停遮罩（可编辑时） */}
        {editable && !isUploading && (
          <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/40 flex items-center justify-center transition-all">
            <Camera className="w-8 h-8 text-text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        {/* 删除按钮 */}
        {editable && currentAvatarUrl && !isUploading && (
          <button
            onClick={handleDelete}
            className="absolute top-0 right-0 bg-danger text-text-primary rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger/90"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 上传提示 */}
      {editable && !isUploading && (
        <div className="text-center">
          <p className="text-sm text-text-secondary mb-1">
            点击或拖拽上传头像
          </p>
          <p className="text-xs text-text-tertiary">
            支持 JPG、PNG、WebP（最大5MB）
          </p>
        </div>
      )}

      {/* 上传中提示 */}
      {isUploading && (
        <p className="text-sm text-accent">
          上传中...
        </p>
      )}

      {/* 隐藏的文件输入框 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
