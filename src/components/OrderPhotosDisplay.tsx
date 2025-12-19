/**
 * 订单照片展示组件 (Order Photos Display Component)
 * 
 * 用户端查看订单照片，支持点击放大
 */

'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import Spinner from '@/components/Spinner';
import { Camera, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

interface OrderPhoto {
  id: string;
  photo_url: string;
  photo_type: 'before' | 'after' | 'detail' | 'other';
  caption: string | null;
  display_order: number;
  created_at: string;
}

interface OrderPhotosDisplayProps {
  orderId: string;
}

const PHOTO_TYPE_LABELS: Record<string, string> = {
  before: '穿线前',
  after: '穿线后',
  detail: '细节图',
  other: '其他',
};

const PHOTO_TYPE_COLORS: Record<string, string> = {
  before: 'bg-info text-text-primary',
  after: 'bg-success text-text-primary',
  detail: 'bg-accent text-text-onAccent',
  other: 'bg-ink-elevated text-text-secondary',
};

export default function OrderPhotosDisplay({ orderId }: OrderPhotosDisplayProps) {
  const [photos, setPhotos] = useState<OrderPhoto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showLightbox, setShowLightbox] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  useEffect(() => {
    loadPhotos();
  }, [orderId]);

  const loadPhotos = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/orders/${orderId}/photos`);
      if (response.ok) {
        const data = await response.json();
        // API可能返回 { data: [...] } 或直接返回数组
        const photosList = Array.isArray(data) ? data : (data.data || []);
        setPhotos(photosList);
      } else {
        setPhotos([]);
      }
    } catch (error) {
      setPhotos([]); // 出错时设置为空数组
    }

    setLoading(false);
  };

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setShowLightbox(true);
  };

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') prevPhoto();
    if (e.key === 'ArrowRight') nextPhoto();
    if (e.key === 'Escape') setShowLightbox(false);
  };

  useEffect(() => {
    if (showLightbox) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [showLightbox]);

  if (loading) {
    return (
      <div className="bg-ink-surface rounded-lg border border-border-subtle p-6">
        <div className="flex items-center justify-center py-12">
          <Spinner size="md" />
          <span className="ml-2 text-text-secondary">加载照片中...</span>
        </div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="bg-ink-surface rounded-lg border border-border-subtle p-6">
        <div className="flex items-center gap-2 mb-2">
          <Camera className="w-5 h-5 text-text-tertiary" />
          <h3 className="text-lg font-semibold text-text-primary">穿线照片</h3>
        </div>
        <p className="text-sm text-text-tertiary">暂无照片，订单完成后管理员会上传穿线照片</p>
      </div>
    );
  }

  return (
    <div className="bg-ink-surface rounded-lg border border-border-subtle p-6">
      <div className="flex items-center gap-2 mb-4">
        <Camera className="w-5 h-5 text-accent" />
        <h3 className="text-lg font-semibold text-text-primary">穿线照片</h3>
        <span className="text-sm text-text-tertiary">({photos.length})</span>
      </div>

      {/* 照片网格 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            onClick={() => openLightbox(index)}
            className="relative group cursor-pointer rounded-lg overflow-hidden border border-border-subtle hover:shadow-lg transition-shadow"
          >
            {/* 缩略图 */}
            <img
              src={photo.photo_url}
              alt={photo.caption || '订单照片'}
              className="w-full h-32 object-cover"
            />

            {/* 类型标签 */}
            <div className="absolute top-2 left-2">
              <span className={`px-2 py-1 ${PHOTO_TYPE_COLORS[photo.photo_type]} text-xs rounded`}>
                {PHOTO_TYPE_LABELS[photo.photo_type]}
              </span>
            </div>

            {/* 放大图标 */}
            <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
              <ZoomIn className="w-8 h-8 text-text-primary" />
            </div>

            {/* 说明文字 */}
            {photo.caption && (
              <div className="p-2 bg-ink-elevated">
                <p className="text-xs text-text-secondary line-clamp-2">{photo.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox 模态框 */}
      {showLightbox && (
        <div className="fixed inset-0 bg-ink/95 z-50 flex items-center justify-center">
          {/* 关闭按钮 */}
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 p-2 bg-ink-elevated/40 hover:bg-ink-elevated/70 rounded-full transition-colors z-10"
          >
            <X className="w-6 h-6 text-text-primary" />
          </button>

          {/* 上一张 */}
          {photos.length > 1 && (
            <button
              onClick={prevPhoto}
              className="absolute left-4 p-3 bg-ink-elevated/40 hover:bg-ink-elevated/70 rounded-full transition-colors z-10"
            >
              <ChevronLeft className="w-8 h-8 text-text-primary" />
            </button>
          )}

          {/* 照片展示 */}
          <div className="max-w-6xl max-h-screen p-4 flex flex-col items-center justify-center">
            <img
              src={photos[currentIndex].photo_url}
              alt={photos[currentIndex].caption || '订单照片'}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />

            {/* 照片信息 */}
            <div className="mt-4 text-center">
              <div className={`inline-block px-3 py-1 ${PHOTO_TYPE_COLORS[photos[currentIndex].photo_type]} text-sm rounded mb-2`}>
                {PHOTO_TYPE_LABELS[photos[currentIndex].photo_type]}
              </div>
              {photos[currentIndex].caption && (
                <p className="text-text-primary text-sm">{photos[currentIndex].caption}</p>
              )}
              <p className="text-text-tertiary text-xs mt-2">
                {currentIndex + 1} / {photos.length}
              </p>
            </div>
          </div>

          {/* 下一张 */}
          {photos.length > 1 && (
            <button
              onClick={nextPhoto}
              className="absolute right-4 p-3 bg-ink-elevated/40 hover:bg-ink-elevated/70 rounded-full transition-colors z-10"
            >
              <ChevronRight className="w-8 h-8 text-text-primary" />
            </button>
          )}

          {/* 缩略图导航 */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-ink-elevated/80 p-2 rounded-lg max-w-full overflow-x-auto border border-border-subtle">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-16 h-16 rounded overflow-hidden border-2 transition-all flex-shrink-0 ${
                    index === currentIndex
                      ? 'border-accent scale-110'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={photo.photo_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
