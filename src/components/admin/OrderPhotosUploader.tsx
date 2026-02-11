/**
 * OrderPhotosUploader Component
 * 
 * 订单照片上传组件（管理员专用）
 * 
 * 功能：
 * - 上传穿线前照片（Before）
 * - 上传穿线后照片（After）
 * - 照片预览和删除
 * - 对比展示
 */

'use client';

import React, { useState } from 'react';
import { Camera, X, Image as ImageIcon } from 'lucide-react';
import { uploadOrderImage, deleteImage, UploadResult } from '@/services/imageUploadService';
import ImagePreview from '@/components/ImagePreview';
import LoadingSpinner from '@/components/loading/LoadingSpinner';
import { AppImage } from '@/components/AppImage';

interface OrderPhotosUploaderProps {
  orderId: string;
  beforePhotos: string[];
  afterPhotos: string[];
  onUploadSuccess?: (type: 'before' | 'after', urls: string[]) => void;
  onUploadError?: (error: string) => void;
  editable?: boolean;
}

export default function OrderPhotosUploader({
  orderId,
  beforePhotos = [],
  afterPhotos = [],
  onUploadSuccess,
  onUploadError,
  editable = true,
}: OrderPhotosUploaderProps) {
  const [beforeImages, setBeforeImages] = useState<string[]>(beforePhotos);
  const [afterImages, setAfterImages] = useState<string[]>(afterPhotos);
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const MAX_PHOTOS = 3;

  // 处理文件上传
  const handleFileSelect = async (
    type: 'before' | 'after',
    files: FileList
  ) => {
    const fileArray = Array.from(files);
    const currentImages = type === 'before' ? beforeImages : afterImages;
    
    // 检查数量限制
    if (currentImages.length + fileArray.length > MAX_PHOTOS) {
      onUploadError?.(`最多只能上传 ${MAX_PHOTOS} 张照片`);
      return;
    }

    const setUploading = type === 'before' ? setUploadingBefore : setUploadingAfter;
    setUploading(true);

    try {
      const results: UploadResult[] = [];
      
      for (const file of fileArray) {
        const result = await uploadOrderImage(orderId, file);
        if (result.success && result.url) {
          results.push(result);
        } else {
          onUploadError?.(result.error || '上传失败');
        }
      }

      // 更新图片列表
      const newUrls = results.filter(r => r.url).map(r => r.url!);
      if (newUrls.length > 0) {
        if (type === 'before') {
          const updated = [...beforeImages, ...newUrls];
          setBeforeImages(updated);
          onUploadSuccess?.('before', updated);
        } else {
          const updated = [...afterImages, ...newUrls];
          setAfterImages(updated);
          onUploadSuccess?.('after', updated);
        }
      }
    } catch (error) {
      console.error('上传失败:', error);
      onUploadError?.('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  // 删除照片
  const handleDelete = async (type: 'before' | 'after', index: number) => {
    const images = type === 'before' ? beforeImages : afterImages;
    const url = images[index];
    
    // 删除图片（使用完整URL）
    await deleteImage(url);

    // 更新列表
    const updated = images.filter((_, i) => i !== index);
    if (type === 'before') {
      setBeforeImages(updated);
      onUploadSuccess?.('before', updated);
    } else {
      setAfterImages(updated);
      onUploadSuccess?.('after', updated);
    }
  };

  // 打开预览
  const handleOpenPreview = (type: 'before' | 'after', index: number) => {
    const images = type === 'before' ? beforeImages : afterImages;
    setPreviewImages(images);
    setPreviewIndex(index);
    setShowPreview(true);
  };

  // 照片卡片组件
  const PhotoCard = ({
    type,
    url,
    index,
  }: {
    type: 'before' | 'after';
    url: string;
    index: number;
  }) => (
    <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-border-subtle group cursor-pointer">
      <AppImage
        src={url}
        alt={`${type === 'before' ? '穿线前' : '穿线后'} ${index + 1}`}
        width={320}
        height={320}
        className="w-full h-full object-cover"
        onClick={() => handleOpenPreview(type, index)}
      />
      
      {editable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(type, index);
          }}
          className="absolute top-2 right-2 bg-danger text-text-primary rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger/90"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  // 上传区域组件
  const UploadArea = ({
    type,
    uploading,
    imageCount,
  }: {
    type: 'before' | 'after';
    uploading: boolean;
    imageCount: number;
  }) => {
    if (!editable || imageCount >= MAX_PHOTOS) return null;

    return (
      <label
        className={`
          aspect-square rounded-lg border-2 border-dashed border-border-subtle
          flex flex-col items-center justify-center
          cursor-pointer transition-all
          hover:border-accent-border hover:bg-ink
          ${uploading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileSelect(type, e.target.files);
            }
          }}
          className="hidden"
          disabled={uploading}
        />
        
        {uploading ? (
          <LoadingSpinner size="md" className="w-8 h-8" />
        ) : (
          <>
            <Camera className="w-8 h-8 text-text-tertiary mb-2" />
            <span className="text-sm text-text-secondary">添加照片</span>
          </>
        )}
      </label>
    );
  };

  return (
    <div className="space-y-6">
      {/* 穿线前照片 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text-secondary">
            📷 穿线前照片 (Before)
          </h3>
          <span className="text-xs text-text-tertiary">
            {beforeImages.length} / {MAX_PHOTOS}
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {beforeImages.map((url, index) => (
            <PhotoCard key={index} type="before" url={url} index={index} />
          ))}
          
          <UploadArea
            type="before"
            uploading={uploadingBefore}
            imageCount={beforeImages.length}
          />
        </div>
      </div>

      {/* 穿线后照片 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text-secondary">
            ✨ 穿线后照片 (After)
          </h3>
          <span className="text-xs text-text-tertiary">
            {afterImages.length} / {MAX_PHOTOS}
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {afterImages.map((url, index) => (
            <PhotoCard key={index} type="after" url={url} index={index} />
          ))}
          
          <UploadArea
            type="after"
            uploading={uploadingAfter}
            imageCount={afterImages.length}
          />
        </div>
      </div>

      {/* 提示信息 */}
      {editable && (
        <div className="bg-info-soft border border-border-subtle rounded-lg p-4">
          <div className="flex items-start gap-2">
            <ImageIcon className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
            <div className="text-sm text-text-secondary">
              <p className="font-medium mb-1">照片上传提示</p>
              <ul className="list-disc list-inside space-y-0.5 text-accent">
                <li>每种类型最多上传 {MAX_PHOTOS} 张照片</li>
                <li>支持 JPG、PNG、WebP 格式</li>
                <li>建议拍摄清晰、光线充足的照片</li>
                <li>照片将展示给用户，展现穿线质量</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 图片预览 */}
      {showPreview && (
        <ImagePreview
          images={previewImages}
          initialIndex={previewIndex}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          showDelete={false}
        />
      )}
    </div>
  );
}
