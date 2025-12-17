/**
 * 订单照片上传组件 (Order Photos Upload Component)
 * 
 * 管理员在订单完成后上传穿线照片
 */

'use client';

import React, { useEffect, useState } from 'react';
import ImageUploader from '@/components/ImageUploader';
import Button from '@/components/Button';
import Toast from '@/components/Toast';
import { UploadResult } from '@/services/imageUploadService';
import { Camera, X, MoveUp, MoveDown } from 'lucide-react';

interface OrderPhoto {
  id: string;
  photo_url: string;
  photo_type: 'before' | 'after' | 'detail' | 'other';
  caption: string | null;
  display_order: number;
  created_at: string;
}

interface OrderPhotosUploadProps {
  orderId: string;
  existingPhotos?: OrderPhoto[];
  onUploadSuccess?: () => void;
}

const PHOTO_TYPES = [
  { value: 'before', label: '穿线前', color: 'bg-blue-100 text-blue-700' },
  { value: 'after', label: '穿线后', color: 'bg-green-100 text-green-700' },
  { value: 'detail', label: '细节图', color: 'bg-purple-100 text-purple-700' },
  { value: 'other', label: '其他', color: 'bg-gray-100 text-gray-700' },
];

export default function OrderPhotosUpload({
  orderId,
  existingPhotos,
  onUploadSuccess,
}: OrderPhotosUploadProps) {
  const [photos, setPhotos] = useState<OrderPhoto[]>(existingPhotos ?? []);
  const [selectedType, setSelectedType] = useState<string>('after');
  const [caption, setCaption] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success',
  });

  // 首次加载已存在的照片，确保管理员可见历史上传
  useEffect(() => {
    const loadExisting = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/orders/${orderId}/photos`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.photos || data.data || [];
          setPhotos(list);
        }
      } catch (error) {
        console.error('Failed to load existing photos:', error);
      } finally {
        setLoading(false);
      }
    };

    if (existingPhotos && existingPhotos.length > 0) {
      setPhotos(existingPhotos);
    } else {
      loadExisting();
    }
  }, [orderId, existingPhotos ? existingPhotos.length : 0]);

  // 上传照片到数据库
  const savePhotoToDatabase = async (photoUrl: string) => {
    const response = await fetch(`/api/orders/${orderId}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photoUrl,
        photoType: selectedType,
        caption: caption.trim() || null,
        displayOrder: photos.length,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save photo');
    }

    return await response.json();
  };

  // 处理上传成功
  const handleUploadSuccess = async (results: UploadResult[]) => {
    setUploading(true);

    try {
      for (const result of results) {
        if (result.success && result.url) {
          const newPhoto = await savePhotoToDatabase(result.url);
          setPhotos((prev) => [...prev, newPhoto]);
        }
      }

      setToast({
        show: true,
        message: `成功上传 ${results.length} 张照片`,
        type: 'success',
      });

      setCaption('');

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error: any) {
      setToast({
        show: true,
        message: error.message || '保存照片失败',
        type: 'error',
      });
    } finally {
      setUploading(false);
    }
  };

  // 删除照片
  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('确定要删除这张照片吗？')) {
      return;
    }

    setDeleting(photoId);

    try {
      const response = await fetch(`/api/orders/${orderId}/photos/${photoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Delete failed');
      }

      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      setToast({
        show: true,
        message: '照片已删除',
        type: 'success',
      });
    } catch (error: any) {
      setToast({
        show: true,
        message: error.message || '删除失败',
        type: 'error',
      });
    } finally {
      setDeleting(null);
    }
  };

  // 调整照片顺序
  const handleMovePhoto = async (photoId: string, direction: 'up' | 'down') => {
    const index = photos.findIndex((p) => p.id === photoId);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === photos.length - 1)
    ) {
      return;
    }

    const newPhotos = [...photos];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newPhotos[index], newPhotos[targetIndex]] = [newPhotos[targetIndex], newPhotos[index]];

    // 更新display_order
    try {
      await fetch(`/api/orders/${orderId}/photos/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos: newPhotos.map((p, i) => ({ id: p.id, displayOrder: i })) }),
      });
      setPhotos(newPhotos);
    } catch (error) {
      console.error('Failed to reorder photos:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* 上传区域 */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Camera className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900">上传照片</h3>
        </div>

        {loading && (
          <div className="text-sm text-slate-500 mb-2">正在加载已上传的照片...</div>
        )}

        {/* 照片类型选择 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            照片类型
          </label>
          <div className="flex flex-wrap gap-2">
            {PHOTO_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedType === type.value
                    ? type.color
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* 照片说明 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            照片说明（可选）
          </label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="例如：BG66UM 26磅，横竖线清晰"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 图片上传器 */}
        <ImageUploader
          uploadOptions={{
            bucket: 'orders',
            folder: orderId,
            fileName: `${selectedType}_${Date.now()}`,
            compress: true,
            maxWidth: 1920,
            maxHeight: 1920,
          }}
          maxFiles={6}
          label="上传照片"
          hint="建议上传穿线前后对比照片（最多 {max} 张）"
          onUploadSuccess={handleUploadSuccess}
          onUploadError={(error) => {
            setToast({
              show: true,
              message: error,
              type: 'error',
            });
          }}
          disabled={uploading}
        />
      </div>

      {/* 已上传照片列表 */}
      {photos.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            已上传照片 ({photos.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo, index) => {
              const photoType = PHOTO_TYPES.find((t) => t.value === photo.photo_type);

              return (
                <div
                  key={photo.id}
                  className="relative group rounded-lg overflow-hidden border border-slate-200"
                >
                  {/* 照片 */}
                  <img
                    src={photo.photo_url}
                    alt={photo.caption || '订单照片'}
                    className="w-full h-48 object-cover"
                  />

                  {/* 类型标签 */}
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${photoType?.color}`}>
                      {photoType?.label}
                    </span>
                  </div>

                  {/* 操作按钮 */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {index > 0 && (
                      <button
                        onClick={() => handleMovePhoto(photo.id, 'up')}
                        className="p-1.5 bg-white rounded-lg shadow hover:bg-slate-50"
                        title="上移"
                      >
                        <MoveUp className="w-4 h-4 text-slate-600" />
                      </button>
                    )}
                    {index < photos.length - 1 && (
                      <button
                        onClick={() => handleMovePhoto(photo.id, 'down')}
                        className="p-1.5 bg-white rounded-lg shadow hover:bg-slate-50"
                        title="下移"
                      >
                        <MoveDown className="w-4 h-4 text-slate-600" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      disabled={deleting === photo.id}
                      className="p-1.5 bg-white rounded-lg shadow hover:bg-red-50"
                      title="删除"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  </div>

                  {/* 说明文字 */}
                  {photo.caption && (
                    <div className="p-3 bg-slate-50">
                      <p className="text-sm text-slate-700">{photo.caption}</p>
                    </div>
                  )}

                  {/* 上传时间 */}
                  <div className="p-2 bg-slate-50 border-t border-slate-200">
                    <p className="text-xs text-slate-500">
                      {new Date(photo.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Toast 通知 */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}
