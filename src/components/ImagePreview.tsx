/**
 * ImagePreview Component
 * 
 * 图片预览组件
 * 
 * 功能：
 * - 单张或多张图片展示
 * - 点击放大查看
 * - 左右切换图片
 * - 关闭预览
 * - 支持删除操作
 */

'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

interface ImagePreviewProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (index: number) => void;
  showDelete?: boolean;
}

export default function ImagePreview({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  onDelete,
  showDelete = false,
}: ImagePreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    // 按 ESC 键关闭
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, currentIndex]);

  if (!isOpen || images.length === 0) return null;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(currentIndex);
      if (images.length === 1) {
        onClose();
      } else if (currentIndex >= images.length - 1) {
        setCurrentIndex((prev) => prev - 1);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/90 flex items-center justify-center">
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-text-primary hover:bg-ink-elevated/70 p-2 rounded-full transition-colors z-10"
      >
        <X className="w-6 h-6" />
      </button>

      {/* 删除按钮 */}
      {showDelete && onDelete && (
        <button
          onClick={handleDelete}
          className="absolute top-4 right-16 text-text-primary hover:bg-danger/20 p-2 rounded-full transition-colors z-10"
        >
          <Trash2 className="w-6 h-6" />
        </button>
      )}

      {/* 左箭头 */}
      {images.length > 1 && (
        <button
          onClick={handlePrevious}
          className="absolute left-4 text-text-primary hover:bg-ink-elevated/70 p-3 rounded-full transition-colors"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {/* 图片显示 */}
      <div className="max-w-7xl max-h-[90vh] w-full px-16">
        <img
          src={images[currentIndex]}
          alt={`图片 ${currentIndex + 1}`}
          className="w-full h-full object-contain"
        />
      </div>

      {/* 右箭头 */}
      {images.length > 1 && (
        <button
          onClick={handleNext}
          className="absolute right-4 text-text-primary hover:bg-ink-elevated/70 p-3 rounded-full transition-colors"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      {/* 图片计数器 */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-ink-elevated/90 text-text-primary px-4 py-2 rounded-full text-sm border border-border-subtle">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* 缩略图导航 */}
      {images.length > 1 && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4 pb-2">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`
                w-16 h-16 rounded-lg overflow-hidden flex-shrink-0
                border-2 transition-all
                ${index === currentIndex 
                  ? 'border-accent opacity-100' 
                  : 'border-transparent opacity-60 hover:opacity-100'
                }
              `}
            >
              <img
                src={img}
                alt={`缩略图 ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
